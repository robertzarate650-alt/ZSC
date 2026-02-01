import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Activity, AlertCircle } from 'lucide-react';
import { createLiveSession, createBlob, decodeAudioData, decode } from '../services/geminiService';
import { LiveServerMessage } from '@google/genai';

const LiveView: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null); // To hold the session object
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // Visualization Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);

  const cleanup = () => {
    // Stop all playing sources
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch(e) {}
    });
    sourcesRef.current.clear();

    // Close session
    if (sessionRef.current) {
        // The API doesn't have an explicit synchronous close method on the promise result easily accessible 
        // without keeping the session object. 
        // Usually we rely on closing the stream or just re-connecting. 
        // But let's assume we can just drop the reference if the SDK handles cleanup on page unload or new connection.
        // Actually, the example uses `onclose` callback.
        // We can't easily force close from here without the session object exposing a close method, 
        // but typically disconnecting the mic stream is enough to stop input.
        // For a full cleanup, we might need to rely on the SDK's behavior or refresh.
        // However, we CAN close the AudioContexts.
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (inputContextRef.current) {
      inputContextRef.current.close();
      inputContextRef.current = null;
    }
    
    cancelAnimationFrame(animationFrameRef.current);
    setIsActive(false);
    setStatus('disconnected');
  };

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      if (!isActive) return;
      animationFrameRef.current = requestAnimationFrame(draw);
      
      analyserRef.current!.getByteFrequencyData(dataArray);
      
      ctx.fillStyle = '#0f172a'; // Clear with bg color
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;
      
      for(let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        
        const r = barHeight + 25 * (i/bufferLength);
        const g = 250 * (i/bufferLength);
        const b = 50;
        
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
    };
    
    draw();
  };

  const startSession = async () => {
    try {
      setStatus('connecting');
      setErrorMessage(null);
      
      // Initialize Audio Contexts
      inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup Visualizer
      const inputSource = inputContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = inputContextRef.current.createAnalyser();
      inputSource.connect(analyserRef.current);
      drawVisualizer();

      // Connect to Gemini Live
      const sessionPromise = createLiveSession({
        onOpen: () => {
            console.log("Session Opened");
            setStatus('connected');
            setIsActive(true);
            
            // Setup Input Processing
            // Note: ScriptProcessor is deprecated but used in the official example for raw PCM access
            const scriptProcessor = inputContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                const pcmBlob = createBlob(inputData);
                
                // Send to Gemini
                sessionPromise.then((session) => {
                    session.sendRealtimeInput({ media: pcmBlob });
                });
            };
            
            inputSource.connect(scriptProcessor);
            scriptProcessor.connect(inputContextRef.current!.destination);
        },
        onMessage: async (message: LiveServerMessage) => {
             // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
                const ctx = audioContextRef.current;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                
                const audioBuffer = await decodeAudioData(
                    decode(base64Audio),
                    ctx,
                    24000,
                    1
                );
                
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                
                // Connect to destination (speakers)
                // We could also connect this to a visualizer for output visualization if desired
                source.connect(ctx.destination);
                
                source.addEventListener('ended', () => {
                    sourcesRef.current.delete(source);
                });
                
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
            }

            // Handle Interruption
            if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(src => src.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
            }
        },
        onError: (e) => {
            console.error("Session Error", e);
            setErrorMessage("Connection error occurred.");
            setStatus('error');
            cleanup();
        },
        onClose: (e) => {
            console.log("Session Closed", e);
            setStatus('disconnected');
            setIsActive(false);
        }
      });
      
      // Store promise to allow sending data
      sessionRef.current = sessionPromise;

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to start live session.");
      setStatus('error');
      cleanup();
    }
  };

  const handleToggle = () => {
    if (isActive) {
      cleanup();
    } else {
      startSession();
    }
  };

  useEffect(() => {
    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-950 items-center justify-center p-6 relative overflow-hidden">
        
      {/* Background Pulse Effect */}
      {isActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <div className="w-96 h-96 bg-emerald-500/10 rounded-full animate-ping opacity-20 duration-[3000ms]" />
           <div className="w-[500px] h-[500px] bg-green-500/10 rounded-full animate-ping opacity-10 duration-[4000ms] delay-700" />
        </div>
      )}

      <div className="z-10 flex flex-col items-center space-y-12 max-w-lg w-full">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold text-slate-100 tracking-tight">GigSync Voice</h2>
          <p className="text-slate-400 text-lg">
            Hands-free co-pilot for your drive.
          </p>
        </div>

        <div className="relative group">
           {/* Visualizer Canvas */}
           <canvas 
             ref={canvasRef} 
             width={300} 
             height={100} 
             className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30 pointer-events-none rounded-full blur-xl scale-150"
           />

          <button
            onClick={handleToggle}
            disabled={status === 'connecting'}
            className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl ${
              isActive 
                ? 'bg-red-500/20 text-red-500 ring-4 ring-red-500/30 hover:bg-red-500/30 scale-110' 
                : status === 'connecting'
                  ? 'bg-yellow-500/20 text-yellow-500 ring-4 ring-yellow-500/30 animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/50 hover:scale-105'
            }`}
          >
            {isActive ? (
              <MicOff className="w-10 h-10" />
            ) : (
              <Mic className="w-10 h-10" />
            )}
          </button>
          
          {/* Status Badge */}
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
             <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${
               isActive 
                 ? 'bg-green-500/10 border-green-500/20 text-green-400'
                 : status === 'connecting'
                   ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                   : 'bg-slate-800 border-slate-700 text-slate-400'
             }`}>
               <div className={`w-2 h-2 rounded-full ${
                  isActive ? 'bg-green-400 animate-pulse' : 
                  status === 'connecting' ? 'bg-yellow-400' : 'bg-slate-500'
               }`} />
               {status === 'connected' ? 'Listening' : 
                status === 'connecting' ? 'Connecting...' : 'Ready to start'}
             </div>
          </div>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 text-red-400 bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 w-full text-center">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <h3 className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Status</h3>
                <p className="text-slate-200 font-mono text-lg">{isActive ? 'Active' : 'Idle'}</p>
            </div>
             <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <h3 className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Model</h3>
                <p className="text-slate-200 font-mono text-lg">Flash 2.5</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LiveView;