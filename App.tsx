import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import AnalyticsView from './components/DashboardView'; // Renamed for clarity
import ActiveShiftView from './components/ActiveShiftView';
import ChatView from './components/ChatView';
import LiveView from './components/LiveView';
import DispatchView from './components/DispatchView';
import MarketplaceView from './components/MarketplaceView'; // Replaced CustomerView
import ActiveOrderView from './components/ActiveOrderView'; // New view for accepted orders
import HomeDashboardView from './components/HomeDashboardView'; // New Home
import SettingsView from './components/SettingsView'; // New Settings
import BillingView from './components/BillingView';
import CustomerOrderView from './components/CustomerOrderView'; // New Customer App
import LiveTrackingView from './components/LiveTrackingView'; // New Tracking View
import { AppMode, Job, ShiftStats, AppNotification, Settings, Order } from './types';
import { Bell, X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

// Helper: Calculate distance between two points in miles (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 3958.8; // Radius of the earth in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<AppMode>(AppMode.HOME);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [settings, setSettings] = useState<Settings>({
    mpg: 25,
    fuelCost: 3.50,
    taxRate: 15,
    notifications: {
      highValueAlerts: true,
      shiftReminders: false,
    }
  });
  
  // GPS Tracking State
  const [trackedMiles, setTrackedMiles] = useState<number>(0);
  const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null);

  // Derived Stats
  const shiftStats: ShiftStats = {
    totalEarnings: jobs.filter(j => j.status === 'completed').reduce((sum, j) => sum + j.pay, 0),
    totalMiles: trackedMiles, 
    jobsCompleted: jobs.filter(j => j.status === 'completed').length,
    activeTime: '3h 12m', // Mocked for demo
    activeTimeInHours: 3.2, // Mocked for profit/hr calculation
  };

  const handleAddJob = (job: Job) => {
    setJobs(prev => [...prev, job]);
  };
  
  const handlePlaceOrder = (order: Order) => {
    setCustomerOrders(prev => [...prev, order]);
    addNotification("New Customer Order!", `${order.restaurant} order placed and is now in the feed.`, 'info');
    // Switch to order feed to show the user their order is live
    setCurrentMode(AppMode.CUSTOMER);
  };
  
  const handleAcceptOrder = (order: Order) => {
    setActiveOrder(order);
    setCustomerOrders(prev => prev.map(o => o.id === order.id ? {...o, status: 'accepted', driverId: 'driver-01'} : o));
    addNotification("Order Accepted!", `Get ready to pick up from ${order.restaurant}.`, 'success');
  };

  const handleUpdateOrderStep = (orderId: string, step: Order['status']) => {
     setCustomerOrders(prev => prev.map(o => o.id === orderId ? {...o, status: step} : o));
  };

  const handleCompleteOrder = (pay: number) => {
    if (activeOrder) {
      // Update customer order status
      setCustomerOrders(prev => prev.map(o => o.id === activeOrder.id ? {...o, status: 'delivered'} : o));

      // Convert completed Order into a Job for analytics
      const completedJob: Job = {
        id: activeOrder.id,
        platform: activeOrder.platform,
        restaurant: activeOrder.restaurant,
        pay: pay,
        distance: activeOrder.distance,
        address: activeOrder.address,
        status: 'completed',
        timestamp: Date.now(),
        estimatedTime: activeOrder.estimatedTime
      };
      setJobs(prev => [...prev, completedJob]);
    }
    setActiveOrder(null);
    addNotification("Delivery Complete!", `+$${pay.toFixed(2)} added to your earnings.`, 'success');
  };


  const handleUpdateJobs = (updatedJobs: Job[]) => {
    setJobs(updatedJobs);
  };

  const handleCompleteJob = (id: string) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'completed' } : j));
  };

  const handleSettingsChange = (newSettings: Settings) => {
    setSettings(newSettings);
  };
  
  const handleStartLiveTracking = () => {
    setCurrentMode(AppMode.LIVE_TRACKING);
  };

  const handleEndLiveTracking = () => {
    setCurrentMode(AppMode.SHIFT);
  };

  // Notification System
  const addNotification = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const id = Date.now().toString() + Math.random();
    setNotifications(prev => [{ id, title, message, timestamp: Date.now(), type }, ...prev]);
    
    setTimeout(() => dismissNotification(id), 5000);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // GPS Tracking Effect
  useEffect(() => {
    let watchId: number | null = null;
    const isTrackingEnabled = currentMode === AppMode.SHIFT || currentMode === AppMode.LIVE_TRACKING;

    if (isTrackingEnabled) {
      if ('geolocation' in navigator) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const currentLat = position.coords.latitude;
            const currentLng = position.coords.longitude;

            if (lastPositionRef.current) {
              const distance = calculateDistance(lastPositionRef.current.lat, lastPositionRef.current.lng, currentLat, currentLng);
              if (distance > 0.005) { 
                setTrackedMiles(prev => prev + distance);
                lastPositionRef.current = { lat: currentLat, lng: currentLng };
              }
            } else {
              lastPositionRef.current = { lat: currentLat, lng: currentLng };
            }
          },
          (error) => console.error("Error tracking location:", error),
          { enableHighAccuracy: true }
        );
      }
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [currentMode]);

  // Simulate High-Value Order Alerts
  useEffect(() => {
    if (!settings.notifications.highValueAlerts) return;
    const interval = setInterval(() => {
        if (Math.random() > 0.7) {
            const restaurants = ["Sushi Zen", "Dragon Bowl", "Pasta House", "Burger Joint", "Taco Fiesta", "Steakhouse Prime"];
            const restaurant = restaurants[Math.floor(Math.random() * restaurants.length)];
            const pay = (Math.random() * 25) + 8;
            const distance = (Math.random() * 10) + 1;
            
            if (pay >= 18 && (pay / distance) >= 1.5) {
                addNotification("High Value Alert! 💰", `${restaurant}: $${pay.toFixed(2)} for ${distance.toFixed(1)} mi`, 'success');
            }
        }
    }, 15000);

    return () => clearInterval(interval);
  }, [settings.notifications.highValueAlerts]);

  const renderContent = () => {
    switch (currentMode) {
      case AppMode.HOME:
        return <HomeDashboardView stats={shiftStats} jobs={jobs} onStartShift={() => setCurrentMode(AppMode.SHIFT)} />;
      case AppMode.CUSTOMER:
        return <MarketplaceView onAcceptOrder={handleAcceptOrder} customerOrders={customerOrders} />;
      case AppMode.CUSTOMER_APP:
        return <CustomerOrderView onPlaceOrder={handlePlaceOrder} customerOrders={customerOrders} />;
      case AppMode.ANALYTICS:
        return <AnalyticsView stats={shiftStats} jobs={jobs} settings={settings} />;
      case AppMode.SHIFT:
        return <ActiveShiftView jobs={jobs} onAddJob={handleAddJob} onUpdateJobs={handleUpdateJobs} onCompleteJob={handleCompleteJob} trackedMiles={trackedMiles} settings={settings} onStartLiveTracking={handleStartLiveTracking} />;
      case AppMode.FLEET:
        return <DispatchView />;
      case AppMode.COPILOT:
        return <ChatView />;
      case AppMode.LIVE:
        return <LiveView />;
      case AppMode.SETTINGS:
        return <SettingsView settings={settings} onSettingsChange={handleSettingsChange} />;
      case AppMode.BILLING:
        return <BillingView />;
      case AppMode.LIVE_TRACKING:
        return <LiveTrackingView initialMiles={trackedMiles} onEndTracking={handleEndLiveTracking} />;
      default:
        return <HomeDashboardView stats={shiftStats} jobs={jobs} onStartShift={() => setCurrentMode(AppMode.SHIFT)} />;
    }
  };

  if (activeOrder) {
    return <ActiveOrderView order={activeOrder} onCompleteOrder={handleCompleteOrder} onUpdateStep={handleUpdateOrderStep} />;
  }
  
  if (currentMode === AppMode.LIVE_TRACKING) {
      return renderContent();
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden relative">
      <Sidebar currentMode={currentMode} onModeChange={setCurrentMode} shiftStats={shiftStats} />
      <main className="flex-1 h-full relative">
        {renderContent()}
        <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 w-80 pointer-events-none">
            {notifications.map(n => (
                <div key={n.id} className={`pointer-events-auto p-4 rounded-xl border shadow-2xl backdrop-blur-md animate-in slide-in-from-right-full fade-in duration-300 flex items-start gap-3 ${
                    n.type === 'success' ? 'bg-emerald-900/90 border-emerald-500/50 text-emerald-100' : 'bg-slate-800/90 border-slate-600 text-slate-200'
                }`}>
                    <div className={`p-2 rounded-full shrink-0 ${ n.type === 'success' ? 'bg-emerald-500/20' : 'bg-slate-700'}`}>
                        {n.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm">{n.title}</h4>
                        <p className="text-xs opacity-90 mt-0.5 leading-relaxed">{n.message}</p>
                    </div>
                    <button onClick={() => dismissNotification(n.id)} className="opacity-60 hover:opacity-100 p-1 rounded-md hover:bg-black/20 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
      </main>
    </div>
  );
};

export default App;