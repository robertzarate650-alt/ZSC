import React, { useState, useEffect, useRef } from 'react';
import { Users, Package, RefreshCw, Zap, Bell, Navigation, Radio, CheckCircle, ShieldAlert, BadgeCheck, XCircle } from 'lucide-react';
import { Driver, DispatchOrder, AppNotification } from '../types';
import { generateFleetScenario, optimizeFleetDispatch } from '../services/geminiService';
import SimulatedMapView, { MapItem, MapLine } from './SimulatedMapView';

const DispatchView: React.FC = () => {
  const [tab, setTab] = useState<'map' | 'admin'>('map');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [orders, setOrders] = useState<DispatchOrder[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  
  const requestRef = useRef<number>(0);

  const addNotification = (title: string, message: string, type: AppNotification['type'] = 'info') => {
    setNotifications(prev => [{
      id: Date.now().toString() + Math.random(),
      title,
      message,
      timestamp: Date.now(),
      type
    }, ...prev.slice(0, 4)]);
  };

  const loadScenario = async () => {
    setIsLoading(true);
    const data = await generateFleetScenario();
    // Inject some fake admin data
    data.drivers.push({
        id: 'd-pending-1', name: 'New Guy', status: 'pending_approval', currentLocation: 'Main St', earnings: 0, rating: 0,
        coordinates: { x: 50, y: 50 }
    });
    data.orders.push({
        id: 'o-dispute-1', customer: 'Angry Customer', address: '123 Bad Ln', amount: 15, status: 'disputed', items: ['Cold Pizza']
    });

    setDrivers(data.drivers);
    setOrders(data.orders);
    addNotification("System Updated", "Fleet data and pending approvals refreshed.", "info");
    setIsLoading(false);
  };

  const handleAutoDispatch = async () => {
    setIsDispatching(true);
    addNotification("AI Optimizing", "Calculating best routes via Gemini...", "info");
    const { assignments } = await optimizeFleetDispatch(drivers, orders);
    
    const newOrders = [...orders];
    const newDrivers = [...drivers];
    let assignmentCount = 0;

    assignments.forEach(({ orderId, driverId }) => {
      const orderIdx = newOrders.findIndex(o => o.id === orderId);
      const driverIdx = newDrivers.findIndex(d => d.id === driverId);

      if (orderIdx >= 0 && driverIdx >= 0) {
        newOrders[orderIdx].status = 'assigned';
        newOrders[orderIdx].assignedDriverId = driverId;
        newDrivers[driverIdx].status = 'busy';
        newDrivers[driverIdx].activeOrderId = orderId;
        assignmentCount++;
        addNotification("Order Dispatched", `Order #${orderId.substring(0,4)} assigned to ${newDrivers[driverIdx].name}`, "success");
      }
    });

    setOrders(newOrders);
    setDrivers(newDrivers);
    setIsDispatching(false);
  };

  const handleDeliveryComplete = (driverId: string, orderId: string) => {
    setOrders(prev => {
        const order = prev.find(o => o.id === orderId);
        if (!order || order.status === 'delivered') return prev;
        return prev.map(o => o.id === orderId ? { ...o, status: 'delivered' } : o);
    });

    setDrivers(prev => {
        const driver = prev.find(d => d.id === driverId);
        if (!driver || driver.status !== 'busy') return prev;
        addNotification("Delivery Complete", `${driver.name} delivered Order #${orderId.substring(0,4)}`, "success");
        return prev.map(d => d.id === driverId ? { ...d, status: 'idle', activeOrderId: undefined, earnings: d.earnings + 25 } : d);
    });
  };

  const approveDriver = (id: string) => {
      setDrivers(prev => prev.map(d => d.id === id ? { ...d, status: 'idle' } : d));
      addNotification("Admin Action", "Driver approved successfully.", "success");
  };

  const resolveDispute = (id: string) => {
      setOrders(prev => prev.filter(o => o.id !== id));
      addNotification("Admin Action", "Dispute resolved and archived.", "success");
  };

  useEffect(() => {
    const animate = () => {
      setDrivers(prevDrivers => {
        return prevDrivers.map(driver => {
            if (driver.status === 'busy' && driver.activeOrderId && driver.coordinates) {
                const order = orders.find(o => o.id === driver.activeOrderId);
                if (order && order.coordinates && order.status !== 'delivered') {
                    const dx = order.coordinates.x - driver.coordinates.x;
                    const dy = order.coordinates.y - driver.coordinates.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    
                    if (dist < 1) {
                        setTimeout(() => handleDeliveryComplete(driver.id, order.id), 0);
                        return driver;
                    }
                    const speed = 0.3;
                    return {
                        ...driver,
                        coordinates: {
                            x: driver.coordinates.x + (dx / dist) * speed,
                            y: driver.coordinates.y + (dy / dist) * speed
                        }
                    };
                }
            }
            return driver;
        });
      });
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]); 

  useEffect(() => { loadScenario(); }, []);

  // --- Map Data Transformation ---
    const mapItems: MapItem[] = [
        ...drivers.filter(d => d.coordinates).map(d => ({
            id: `driver-${d.id}`,
            type: 'driver',
            coords: d.coordinates!,
            status: d.status
        })),
        ...orders.filter(o => o.coordinates && o.status !== 'delivered').map(o => ({
            id: `order-${o.id}`,
            type: o.status === 'pending' ? 'pending_order' : 'delivery',
            coords: o.coordinates!
        }))
    ];

    const mapLines: MapLine[] = drivers
        .filter(d => d.status === 'busy' && d.activeOrderId && d.coordinates)
        .map(d => {
            const order = orders.find(o => o.id === d.activeOrderId);
            if (!order || !order.coordinates) return null;
            return {
                id: `route-${d.id}`,
                from: d.coordinates!,
                to: order.coordinates,
                style: 'pulse'
            };
        })
        .filter((line): line is MapLine => line !== null);
  // --- End Map Data Transformation ---

  return (
    <div className="flex flex-col h-full bg-slate-950 p-4 md:p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Radio className="w-6 h-6 text-indigo-500" /> Admin Panel
            </h2>
            <p className="text-slate-400 text-sm">Fleet Command & Administration</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-1 flex items-center">
                <button 
                    onClick={() => setTab('map')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${tab === 'map' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    Live Map
                </button>
                <button 
                    onClick={() => setTab('admin')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${tab === 'admin' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    Approvals & Disputes
                </button>
            </div>
            <button 
              onClick={loadScenario}
              disabled={isLoading}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors border border-slate-700"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Simulate
            </button>
          </div>
        </div>

        {tab === 'map' ? (
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Drivers List */}
              <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden max-h-[600px]">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                   <h3 className="font-bold text-slate-200 flex items-center gap-2">
                     <Users className="w-4 h-4 text-blue-400" /> Drivers
                   </h3>
                   <span className="text-slate-400 text-xs">
                     {drivers.filter(d => d.status !== 'offline').length} Online
                   </span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                   {drivers.map(driver => (
                     <div key={driver.id} className="flex flex-col p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg hover:bg-slate-800 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${driver.status === 'idle' ? 'bg-green-500' : driver.status === 'busy' ? 'bg-red-500' : 'bg-slate-500'}`} />
                                <span className="font-medium text-slate-200 text-sm">{driver.name}</span>
                            </div>
                            <span className="font-mono text-green-400 text-xs">${driver.earnings}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Navigation className="w-3 h-3" />
                            <span className="truncate">{driver.currentLocation}</span>
                        </div>
                     </div>
                   ))}
                </div>
              </div>

              {/* Map */}
              <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl relative overflow-hidden h-[600px] group">
                <SimulatedMapView items={mapItems} lines={mapLines} />
                 {/* Notifications Overlay */}
                <div className="absolute bottom-4 right-4 w-72 space-y-2 z-30 pointer-events-none">
                    {notifications.map(notif => (
                        <div key={notif.id} className={`p-3 rounded-lg border shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-right-10 duration-300 ${notif.type === 'success' ? 'bg-green-900/80 border-green-500/30 text-green-100' : notif.type === 'warning' ? 'bg-yellow-900/80 border-yellow-500/30 text-yellow-100' : 'bg-slate-800/80 border-slate-700 text-slate-200'}`}>
                            <div className="flex items-start gap-2">
                                <Bell className="w-4 h-4 mt-0.5 opacity-70" />
                                <div><p className="font-bold text-xs">{notif.title}</p><p className="text-xs opacity-90">{notif.message}</p></div>
                            </div>
                        </div>
                    ))}
                </div>
              </div>

              {/* Queue */}
              <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden max-h-[600px]">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                  <h3 className="font-bold text-slate-200 flex items-center gap-2"> <Package className="w-4 h-4 text-orange-400" /> Queue </h3>
                  <button onClick={handleAutoDispatch} disabled={isDispatching} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1 rounded flex items-center gap-1"><Zap className="w-3 h-3" /> Auto</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {orders.map(order => (
                    <div key={order.id} className={`p-4 rounded-lg border ${order.status === 'assigned' ? 'bg-indigo-900/10 border-indigo-500/20' : 'bg-slate-800 border-slate-700'}`}>
                      <div className="flex justify-between items-start mb-2"><span className="font-bold text-slate-200 text-sm">{order.customer}</span><span className="text-green-400 font-mono text-sm">${order.amount}</span></div>
                      <p className="text-xs text-slate-400 mb-3 truncate">{order.address}</p>
                      <div className="flex items-center justify-between"><span className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-slate-700">{order.status}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Approvals */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <BadgeCheck className="w-5 h-5 text-indigo-400" /> Driver Approvals
                    </h3>
                    <div className="space-y-4">
                        {drivers.filter(d => d.status === 'pending_approval').length === 0 ? (
                            <p className="text-slate-500 text-sm">No pending approvals.</p>
                        ) : (
                            drivers.filter(d => d.status === 'pending_approval').map(driver => (
                                <div key={driver.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-white">{driver.name}</p>
                                        <p className="text-xs text-slate-400">ID: {driver.id}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => approveDriver(driver.id)} className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium">Approve</button>
                                        <button className="bg-red-900/50 text-red-400 px-3 py-1.5 rounded-lg text-sm font-medium">Reject</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Disputes */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-red-400" /> Dispute Resolution
                    </h3>
                    <div className="space-y-4">
                         {orders.filter(o => o.status === 'disputed').length === 0 ? (
                            <p className="text-slate-500 text-sm">No active disputes.</p>
                        ) : (
                            orders.filter(o => o.status === 'disputed').map(order => (
                                <div key={order.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-red-400">Dispute: Order #{order.id}</span>
                                        <span className="text-xs text-slate-400">${order.amount}</span>
                                    </div>
                                    <p className="text-sm text-slate-300 mb-2">Customer reported issue: Item missing.</p>
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={() => resolveDispute(order.id)} className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-sm">Refund</button>
                                        <button onClick={() => resolveDispute(order.id)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-sm">Dismiss</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default DispatchView;