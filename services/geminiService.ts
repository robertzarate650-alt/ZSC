import { GoogleGenAI, GenerateContentResponse, LiveServerMessage, Modality, Type } from "@google/genai";
import { Job, Order, Driver, DispatchOrder, EarningsAnalysisResult, EarningsForecast } from "../types";

const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

// --- Chat & Assistant ---

export const streamChatResponse = async (
  model: string,
  message: string,
  imagePart?: { inlineData: { data: string; mimeType: string } }
): Promise<AsyncGenerator<GenerateContentResponse, void, unknown>> => {
  const chat = ai.chats.create({
    model: model,
    config: {
      systemInstruction: "You are an expert gig-economy consultant. Help drivers maximize tax deductions, choose the best times to drive, and handle difficult delivery situations.",
      tools: [{ googleSearch: {} }] 
    }
  });

  if (imagePart) {
     const response = await ai.models.generateContentStream({
        model: model,
        contents: {
            parts: [imagePart, { text: message }]
        }
     });
     return response;
  } else {
    const response = await chat.sendMessageStream({ message });
    return response;
  }
};

// --- Vision: Offer Parser ---

export const parseOfferScreenshot = async (base64Data: string): Promise<Partial<Job>> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
        { text: `Analyze this delivery offer screenshot. Extract details and calculate a highly accurate 'profitScore' (1-10).

        Extraction Tasks:
        1. Platform Name (UberEats, DoorDash, etc. - infer from UI if text is missing).
        2. Restaurant Name.
        3. Pay Amount (number).
        4. Total Distance (miles, number).
        5. Delivery Address (or 'Unknown').
        6. Estimated Time (minutes, if visible).

        Profit Score Calculation Factors:
        1. **Base Ratio**: Pay-to-mile ratio ($2/mile is ideal).
        2. **Time & Traffic**: Detect time from status bar (if visible) to estimate traffic impact (Peak vs Off-peak).
        3. **Wait Times**: Estimate restaurant prep time based on brand (e.g., fast food = fast, steakhouse = slow).
        4. **Operating Costs**: Factor in estimated gas/wear and typical platform fees/adjustments.

        Return JSON object: { platform, restaurant, pay, distance, address, profitScore, estimatedTime }` }
      ]
    },
    config: {
      // responseMimeType not supported on 2.5-flash-image yet for structured output in all regions, 
      // but we can prompt for JSON string.
    }
  });

  const text = response.text;
  if (!text) throw new Error("Could not analyze image");

  // Simple cleaner for JSON from chat model
  const jsonBlock = text.match(/```json\n([\s\S]*?)\n```/)?.[1] || text.replace(/```json|```/g, '');
  
  try {
    const data = JSON.parse(jsonBlock);
    return {
      platform: data.Platform || data.platform || 'Other',
      restaurant: data.Restaurant || data.restaurant || 'Unknown',
      pay: parseFloat(data.Pay || data.pay || 0),
      distance: parseFloat(data.Distance || data.distance || 0),
      address: data.Address || data.address || 'Unknown',
      profitScore: data.profitScore || 5,
      estimatedTime: parseInt(data.estimatedTime || data.EstimatedTime || 0) || undefined
    };
  } catch (e) {
    console.error("JSON Parse Error", e);
    throw new Error("Failed to parse offer details.");
  }
};

// --- Logic: Order Assistant ---
export interface ManualOrderAnalysis {
  recommendation: 'Take' | 'Stack' | 'Decline';
  reasoning: string;
}

export const analyzeManualOrder = async (details: {
  pay: number;
  distance: number;
  estimatedTime: number; // in minutes
}): Promise<ManualOrderAnalysis> => {
  const { pay, distance, estimatedTime } = details;

  const prompt = `
    As an expert gig driver assistant, analyze this delivery offer and provide a recommendation.
    - Payout: $${pay.toFixed(2)}
    - Distance: ${distance.toFixed(1)} miles
    - Estimated Time: ${estimatedTime} minutes

    Factors to consider:
    - Dollars per mile (aim for > $1.50).
    - Dollars per hour (aim for > $20).
    - Short, low-pay orders can be good for stacking with another order.
    - Long distance orders need very high pay to be worthwhile.

    Return a JSON object with your recommendation and a brief, one-sentence reasoning.
    Recommendation must be one of: "Take", "Stack", "Decline".
    The reasoning should be concise and helpful, e.g., "Excellent pay per mile and per hour." or "Low pay for the distance, but could be stacked."
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recommendation: {
            type: Type.STRING,
            enum: ['Take', 'Stack', 'Decline'],
          },
          reasoning: { type: Type.STRING },
        },
      },
    },
  });

  try {
    const parsed = JSON.parse(response.text || '{}');
    return parsed as ManualOrderAnalysis;
  } catch (e) {
    throw new Error('Failed to get AI recommendation.');
  }
};

// --- Logic: Analytics ---
export const analyzeEarningsData = async (jobs: Job[]): Promise<EarningsAnalysisResult> => {
  const simplifiedJobs = jobs.map(j => ({
    platform: j.platform,
    pay: j.pay,
    distance: j.distance,
    address: j.address, // For zone analysis
    hour: new Date(j.timestamp).getHours(), // For hour analysis
    day: new Date(j.timestamp).toLocaleString('en-us', { weekday: 'long' })
  }));

  const prompt = `
    As an expert gig-driver analyst, examine this data of completed jobs.
    Provide actionable insights to help a driver earn more money.

    Job Data: ${JSON.stringify(simplifiedJobs)}

    Analysis Tasks:
    1.  **Best Hours**: Identify the most profitable time block (e.g., "5 PM - 9 PM").
    2.  **Best Zones**: Identify the top 2 most profitable geographic zones by looking for common keywords in the addresses (e.g., "Downtown", "Northside").
    3.  **Platform Comparison**: Calculate total earnings and percentage for each platform.
    4.  **Top Day**: Find the highest-earning day of the week.
    5.  **Efficiency Tip**: Provide one concise, actionable tip based on the data.

    Return a JSON object.
  `;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          bestHours: { type: Type.STRING },
          bestZones: { type: Type.ARRAY, items: { type: Type.STRING } },
          platformComparison: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                platform: { type: Type.STRING },
                totalEarnings: { type: Type.NUMBER },
                percentage: { type: Type.NUMBER }
              }
            }
          },
          topPerformingDay: { type: Type.STRING },
          efficiencyTip: { type: Type.STRING }
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}') as EarningsAnalysisResult;
  } catch(e) {
    throw new Error("Failed to analyze earnings data.");
  }
};


// --- Logic: Earnings Forecaster ---
export const getEarningsForecast = async (jobs: Job[], currentTime: Date): Promise<EarningsForecast> => {
  if (jobs.length === 0) {
    return {
      predictedRate: 18.50,
      reasoning: "General estimate based on typical market conditions.",
      peakTime: "5 PM - 9 PM"
    };
  }
  
  const simplifiedJobs = jobs.map(j => ({
    pay: j.pay,
    hour: new Date(j.timestamp).getHours(),
    day: new Date(j.timestamp).getDay() // 0 = Sunday
  }));

  const prompt = `
    As a gig-work economist, analyze this driver's historical earnings data and the current time to predict their potential hourly earnings for the next 2-3 hours.

    Historical Data (simplified): ${JSON.stringify(simplifiedJobs)}
    Current Time: ${currentTime.toLocaleString('en-US', { weekday: 'long', hour: 'numeric', hour12: true })}

    Analysis Factors:
    1.  **Time of Day**: Compare the current time to typical meal rushes (lunch 11a-2p, dinner 5p-9p).
    2.  **Day of Week**: Weekends (Fri/Sat/Sun) are generally busier than weekdays.
    3.  **Historical Performance**: Use the driver's past earnings during similar time windows as a baseline.

    Return a JSON object with:
    - predictedRate: A specific number for the predicted hourly rate.
    - reasoning: A brief, one-sentence explanation for the prediction.
    - peakTime: The next predicted high-demand time block (e.g., "Dinner Rush (5 PM - 9 PM)").
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          predictedRate: { type: Type.NUMBER },
          reasoning: { type: Type.STRING },
          peakTime: { type: Type.STRING }
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}') as EarningsForecast;
  } catch (e) {
    throw new Error("Failed to generate earnings forecast.");
  }
};


// --- Logic: Route Optimizer ---

export const optimizeRouteStack = async (jobs: Job[]): Promise<Job[]> => {
  if (jobs.length <= 1) return jobs;

  // Simulate fetching real-time traffic data from Google Maps API
  const jobsWithTraffic = jobs.map(j => {
    // In a real app, we would query the API here.
    // Simulating: 20% chance of Heavy traffic, 30% Moderate, 50% Light
    const rand = Math.random();
    const trafficCondition = rand > 0.8 ? 'Heavy (Accident Reported)' : rand > 0.5 ? 'Moderate' : 'Light';
    return { ...j, trafficCondition };
  });

  const jobList = jobsWithTraffic.map(j => 
    `ID: ${j.id}, Restaurant: ${j.restaurant}, Customer: ${j.address}, Traffic: ${j.trafficCondition}`
  ).join('\n');
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `I have these delivery jobs. Please order them in the most logical sequence for a driver to complete to MINIMIZE TOTAL DELIVERY TIME.
    
    CRITICAL: You must account for the reported 'Traffic' conditions. 
    - Avoid or de-prioritize routes that would pass through 'Heavy' traffic areas if a faster alternative sequence exists.
    - 'Light' traffic paths should be preferred.
    - Pickup all food items first before starting deliveries (unless a drop-off is en-route and highly efficient).
    
    Return ONLY a JSON array of IDs in the correct order.

    ${jobList}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  const orderedIds: string[] = JSON.parse(response.text || '[]');
  
  // Reorder original array
  const orderedJobs: Job[] = [];
  orderedIds.forEach(id => {
    const job = jobs.find(j => j.id === id);
    if (job) orderedJobs.push(job);
  });
  
  // Add any missing ones to the end
  jobs.forEach(j => {
    if (!orderedIds.includes(j.id)) orderedJobs.push(j);
  });

  return orderedJobs;
};

// --- Logic: Stack Assistant ---

export interface StackAnalysisResult {
  recommendedJobIds: string[];
  reasoning: string;
  totalProjectedPay: number;
  totalDistance: number;
  efficiencyRating: 'High' | 'Medium' | 'Low';
  strategyTip: string;
}

export const analyzeStackBundle = async (jobs: Job[]): Promise<StackAnalysisResult> => {
  if (jobs.length === 0) throw new Error("No jobs to analyze");

  // Simulate Traffic Context
  const context = jobs.map(j => ({
    ...j,
    traffic: Math.random() > 0.7 ? 'Heavy' : 'Light'
  }));

  const prompt = `
    As an expert logistics assistant, analyze these delivery jobs for a gig driver.
    
    Jobs:
    ${JSON.stringify(context.map(j => ({
      id: j.id,
      restaurant: j.restaurant,
      pay: j.pay,
      distance: j.distance,
      address: j.address,
      traffic: j.traffic
    })))}

    Task:
    Determine the best subset of these jobs to "stack" (bundle) together to maximize profit per hour.
    You can recommend taking all of them, or rejecting some if they are inefficient (e.g., opposite direction, low pay, heavy traffic).
    
    Return JSON with:
    - recommendedJobIds: array of IDs for the optimal bundle.
    - reasoning: Why this bundle is best (mention traffic, overlapping routes, or high pay).
    - totalProjectedPay: sum of pay for recommended jobs.
    - totalDistance: estimated total distance for the bundle (consider overlap savings).
    - efficiencyRating: 'High', 'Medium', or 'Low'.
    - strategyTip: A short actionable tip (e.g., "Pickup Taco Bell first").
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
            recommendedJobIds: { type: Type.ARRAY, items: { type: Type.STRING } },
            reasoning: { type: Type.STRING },
            totalProjectedPay: { type: Type.NUMBER },
            totalDistance: { type: Type.NUMBER },
            efficiencyRating: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
            strategyTip: { type: Type.STRING }
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    throw new Error("Failed to analyze stack.");
  }
};


// --- Fleet Management Services ---

export const generateFleetScenario = async (): Promise<{ drivers: Driver[], orders: DispatchOrder[] }> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: "Generate a realistic scenario for a local delivery fleet in a 2D grid city.\n" +
              "Create 4 Drivers: names, status (idle/busy/offline), currentLocation (address), earnings, rating (3.5-5.0), and coordinates (x, y between 10-90).\n" +
              "Create 6 Pending Orders: customer name, address, amount, items, and coordinates (x, y between 10-90).\n" +
              "Return JSON.",
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          drivers: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                status: { type: Type.STRING, enum: ['idle', 'busy', 'offline', 'pending_approval'] },
                currentLocation: { type: Type.STRING },
                earnings: { type: Type.NUMBER },
                rating: { type: Type.NUMBER },
                coordinates: { 
                    type: Type.OBJECT, 
                    properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } 
                }
              }
            }
          },
          orders: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                customer: { type: Type.STRING },
                address: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                items: { type: Type.ARRAY, items: { type: Type.STRING } },
                status: { type: Type.STRING, enum: ['pending'] },
                coordinates: { 
                    type: Type.OBJECT, 
                    properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } 
                }
              }
            }
          }
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '{ "drivers": [], "orders": [] }');
  } catch (e) {
    console.error("Fleet generation failed", e);
    return { drivers: [], orders: [] };
  }
};

export const optimizeFleetDispatch = async (drivers: Driver[], orders: DispatchOrder[]): Promise<{ assignments: { orderId: string, driverId: string }[] }> => {
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const availableDrivers = drivers.filter(d => d.status !== 'offline' && d.status !== 'pending_approval');

  if (pendingOrders.length === 0 || availableDrivers.length === 0) return { assignments: [] };

  const prompt = `
    Match these pending orders to available drivers to minimize delivery time (calculate distance using coordinates x,y).
    Drivers: ${JSON.stringify(availableDrivers.map(d => ({ id: d.id, name: d.name, coords: d.coordinates, status: d.status })))}
    Orders: ${JSON.stringify(pendingOrders.map(o => ({ id: o.id, coords: o.coordinates })))}
    
    Return JSON array of assignments: { orderId, driverId }.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          assignments: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                orderId: { type: Type.STRING },
                driverId: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '{ "assignments": [] }');
  } catch (e) {
    return { assignments: [] };
  }
};


// --- Image Generation (Retained) ---

export const generateImage = async (prompt: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }
  }
  
  throw new Error("No image generated");
};

// --- Marketplace: Simulated Orders ---

export const fetchSimulatedOrders = async (): Promise<Order[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: "Generate 3 realistic delivery orders for a gig driver (DoorDash or UberEats). \n" +
              "Include: id (unique), platform ('DoorDash' or 'UberEats'), restaurant, pay (5-25), distance (1-10), address, items (string array), and estimatedTime (minutes, calculated based on distance + traffic). \n" +
              "Also include pickupCoords (x, y between 10-90) and deliveryCoords (x, y between 10-90) for a 2D map simulation.\n" +
              "Return JSON array.",
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            platform: { type: Type.STRING },
            restaurant: { type: Type.STRING },
            pay: { type: Type.NUMBER },
            distance: { type: Type.NUMBER },
            address: { type: Type.STRING },
            items: { type: Type.ARRAY, items: { type: Type.STRING } },
            estimatedTime: { type: Type.NUMBER, description: "Estimated delivery time in minutes" },
            pickupCoords: { 
                type: Type.OBJECT, 
                properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } 
            },
            deliveryCoords: { 
                type: Type.OBJECT, 
                properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } 
            }
          }
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Failed to fetch orders", e);
    return [];
  }
};


export const generateCustomerOrder = async (): Promise<Omit<Order, 'id' | 'status'>> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: "Generate one realistic food delivery order from a customer's perspective (DoorDash or UberEats). \n" +
              "Include: platform, restaurant, pay (driver payout, 5-25), distance (1-10), address (customer's address), items (string array of 2-3 food items), and estimatedTime (minutes). \n" +
              "Also include pickupCoords (restaurant, x/y between 10-90) and deliveryCoords (customer, x/y between 10-90) for a 2D map simulation.\n" +
              "Return a single JSON object.",
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          platform: { type: Type.STRING },
          restaurant: { type: Type.STRING },
          pay: { type: Type.NUMBER },
          distance: { type: Type.NUMBER },
          address: { type: Type.STRING },
          items: { type: Type.ARRAY, items: { type: Type.STRING } },
          estimatedTime: { type: Type.NUMBER },
          pickupCoords: { 
              type: Type.OBJECT, 
              properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } 
          },
          deliveryCoords: { 
              type: Type.OBJECT, 
              properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } 
          }
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Failed to generate order", e);
    throw new Error("Could not generate an order.");
  }
};


// --- Verification: Photo Analysis ---

export const verifyDeliveryPhoto = async (base64Data: string): Promise<{ verified: boolean; reason: string }> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
        { text: "Verify if this image shows a food delivery package at a door. Return JSON: { verified: boolean, reason: string }." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          verified: { type: Type.BOOLEAN },
          reason: { type: Type.STRING }
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return { verified: false, reason: "Analysis failed" };
  }
};

// --- Live API Helpers ---

export const createLiveSession = async (
  callbacks: {
    onOpen: () => void;
    onMessage: (message: LiveServerMessage) => void;
    onError: (e: ErrorEvent) => void;
    onClose: (e: CloseEvent) => void;
  }
) => {
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks: {
        onopen: callbacks.onOpen,
        onmessage: callbacks.onMessage,
        onerror: callbacks.onError,
        onclose: callbacks.onClose
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
      },
      systemInstruction: 'You are a smart driver companion. Keep responses short and focused on navigation, earnings, and safety.',
    },
  });
};

// --- Audio Utils ---

export function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  
  let binary = '';
  const bytes = new Uint8Array(int16.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  return {
    data: base64,
    mimeType: 'audio/pcm;rate=16000',
  };
}

export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}