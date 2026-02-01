export enum AppMode {
  HOME = 'HOME',
  SHIFT = 'SHIFT',
  FLEET = 'FLEET',
  COPILOT = 'COPILOT',
  LIVE = 'LIVE',
  CUSTOMER = 'CUSTOMER', // This is the Driver's Order Feed
  CUSTOMER_APP = 'CUSTOMER_APP', // This is the new Customer-facing app
  ANALYTICS = 'ANALYTICS',
  SETTINGS = 'SETTINGS',
  BILLING = 'BILLING',
  LIVE_TRACKING = 'LIVE_TRACKING',
}

export interface Job {
  id: string;
  platform: 'UberEats' | 'DoorDash' | 'GrubHub' | 'Other';
  restaurant: string;
  pay: number;
  distance: number; // in miles
  address: string;
  status: 'pending' | 'active' | 'completed';
  timestamp: number;
  profitScore?: number; // 1-10 calculated by AI
  estimatedTime?: number; // in minutes
}

export interface Order {
  id: string;
  platform: 'DoorDash' | 'UberEats' | 'GrubHub' | 'Other';
  restaurant: string;
  pay: number;
  distance: number;
  address: string;
  items: string[];
  estimatedTime: number; // minutes
  pickupCoords: { x: number; y: number };
  deliveryCoords: { x: number; y: number };
  status?: 'pending' | 'accepted' | 'picked_up' | 'delivered';
  driverId?: string;
}

// Fleet Types
export interface Coordinates {
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
}

export interface Driver {
  id: string;
  name: string;
  status: 'idle' | 'busy' | 'offline' | 'pending_approval';
  currentLocation: string;
  coordinates?: Coordinates; 
  activeOrderId?: string;
  earnings: number;
  rating?: number;
}

export interface DispatchOrder {
  id: string;
  customer: string;
  address: string;
  coordinates?: Coordinates;
  amount: number;
  status: 'pending' | 'assigned' | 'picked_up' | 'delivered' | 'disputed';
  assignedDriverId?: string;
  items: string[];
}

export interface AppNotification {
  id:string;
  title: string;
  message: string;
  timestamp: number;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface ShiftStats {
  totalEarnings: number;
  totalMiles: number;
  activeTime: string;
  activeTimeInHours: number;
  jobsCompleted: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string; // base64
  isError?: boolean;
}

export interface EarningsAnalysisResult {
  bestHours: string;
  bestZones: string[];
  platformComparison: { platform: 'UberEats' | 'DoorDash' | 'GrubHub' | 'Other'; totalEarnings: number; percentage: number }[];
  topPerformingDay: string;
  efficiencyTip: string;
}

export interface EarningsForecast {
  predictedRate: number;
  reasoning: string;
  peakTime: string;
}

export interface Settings {
  mpg: number;
  fuelCost: number; // per gallon
  taxRate: number; // percentage
  notifications: {
    highValueAlerts: boolean;
    shiftReminders: boolean;
  };
}