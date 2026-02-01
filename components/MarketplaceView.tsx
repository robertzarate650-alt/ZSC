import React, { useEffect, useState } from 'react';
import { RefreshCw, MapPin, DollarSign, ShoppingBag, ArrowRight, Clock, Map as MapIcon, User } from 'lucide-react';
import { fetchSimulatedOrders } from '../services/geminiService';
import { Order } from '../types';
import SimulatedMapView, { MapItem, MapLine } from './SimulatedMapView';

interface MarketplaceViewProps {
  onAcceptOrder: (order: Order) => void;
  customerOrders: Order[];
}

const MarketplaceView: React.FC<MarketplaceViewProps> = ({ onAcceptOrder, customerOrders }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredOrderId, setHoveredOrderId] = useState<string | null>(null);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      // Fetch AI orders and combine with pending customer orders
      const aiOrders = await fetchSimulatedOrders();
      const pendingCustomerOrders = customerOrders.filter(o => o.status === 'pending');
      setOrders([...pendingCustomerOrders, ...aiOrders]);
    } catch (e) {
      console.error("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerOrders]);

  // Transform data for the map component
  const mapItems: MapItem[] = orders.flatMap(order => [
    { id: `pickup-${order.id}`, type: 'pickup', coords: order.pickupCoords, isHovered: order.id === hoveredOrderId },
    { id: `delivery-${order.id}`, type: 'delivery', coords: order.deliveryCoords, isHovered: order.id === hoveredOrderId }
  ]);

  const mapLines: MapLine[] = orders.map(order => ({
      id: `line-${order.id}`,
      from: order.pickupCoords,
      to: order.deliveryCoords,
      style: order.id === hoveredOrderId ? 'solid' : 'dashed',
      color: order.id === hoveredOrderId ? '#818cf8' : undefined
  }));

  return (
    <div className="flex flex-col md:flex-row h-full bg-slate-950 overflow-hidden">
      
      {/* Map Section */}
      <div className="w-full md:w-5/12 h-64 md:h-full bg-slate-900 relative border-b md:border-b-0 md:border-l border-slate-800 order-1 md:order-2 flex-shrink-0">
         <SimulatedMapView items={mapItems} lines={mapLines} />
         
         <div className="absolute top-4 left-4 z-20 bg-slate-900/80 backdrop-blur-sm border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 flex items-center gap-2">
            <MapIcon className="w-4 h-4 text-indigo-400" /> Live Activity
         </div>
      </div>

      {/* List Section */}
      <div className="flex-1 h-full overflow-y-auto p-4 md:p-6 order-2 md:order-1 flex flex-col">
        <div className="max-w-3xl w-full mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-100">Live Feed</h2>
              <p className="text-slate-400">Aggregating DoorDash, UberEats & GigSync orders...</p>
            </div>
            <button 
              onClick={loadOrders}
              disabled={isLoading}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="grid gap-4">
            {orders.map((order) => {
              const isCustomerOrder = customerOrders.some(co => co.id === order.id);
              return (
              <div 
                key={order.id}
                onMouseEnter={() => setHoveredOrderId(order.id)}
                onMouseLeave={() => setHoveredOrderId(null)}
                className={`bg-slate-900 border rounded-xl p-5 transition-all group ${
                    order.id === hoveredOrderId ? 'border-indigo-500/50 shadow-indigo-500/10 shadow-lg scale-[1.01]' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                        isCustomerOrder 
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : order.platform === 'DoorDash' 
                            ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                            : 'bg-green-500/10 text-green-500 border border-green-500/20'
                      }`}>
                        {isCustomerOrder ? 'GigSync' : order.platform}
                      </span>
                      <h3 className="text-lg font-semibold text-slate-200">{order.restaurant}</h3>
                      {isCustomerOrder && <User className="w-4 h-4 text-blue-400" title="Placed by a user"/>}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{order.distance.toFixed(1)} mi • {order.address}</span>
                      </div>
                      {order.estimatedTime && (
                        <div className="flex items-center gap-1 text-blue-400">
                          <Clock className="w-4 h-4" />
                          <span>~{order.estimatedTime} mins</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <ShoppingBag className="w-4 h-4" />
                        <span>{order.items.length} items</span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-slate-500 line-clamp-1">
                      {order.items.join(", ")}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 mt-2 md:mt-0">
                    <div className="flex flex-col items-end min-w-[80px]">
                      <span className="text-2xl font-bold text-emerald-400">${order.pay.toFixed(2)}</span>
                      <span className="text-xs text-slate-500">Guaranteed</span>
                    </div>
                    <button
                      onClick={() => onAcceptOrder(order)}
                      className="flex-1 md:flex-none bg-slate-100 hover:bg-white text-slate-900 px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      Accept <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )})}

            {!isLoading && orders.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                No orders available right now. Refresh the feed.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceView;