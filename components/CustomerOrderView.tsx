import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Package, MapPin, Navigation, CheckCircle, Loader2 } from 'lucide-react';
import { Order } from '../types';
import { generateCustomerOrder } from '../services/geminiService';
import SimulatedMapView, { MapItem, MapLine } from './SimulatedMapView';

interface CustomerOrderViewProps {
  onPlaceOrder: (order: Order) => void;
  customerOrders: Order[];
}

const CustomerOrderView: React.FC<CustomerOrderViewProps> = ({ onPlaceOrder, customerOrders }) => {
  const [viewState, setViewState] = useState<'idle' | 'generating' | 'confirming' | 'tracking'>('idle');
  const [generatedOrder, setGeneratedOrder] = useState<Omit<Order, 'id' | 'status'> | null>(null);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentStatus = placedOrder ? customerOrders.find(o => o.id === placedOrder.id)?.status : 'pending';

  const handleGenerate = async () => {
    setViewState('generating');
    setError(null);
    try {
      const orderDetails = await generateCustomerOrder();
      setGeneratedOrder(orderDetails);
      setViewState('confirming');
    } catch (e) {
      setError("Could not generate an order. Please try again.");
      setViewState('idle');
    }
  };

  const handlePlaceOrder = () => {
    if (!generatedOrder) return;
    const newOrder: Order = {
      ...generatedOrder,
      id: `cust-${Date.now()}`,
      status: 'pending'
    };
    setPlacedOrder(newOrder);
    onPlaceOrder(newOrder);
    setViewState('tracking');
  };
  
  const resetFlow = () => {
      setViewState('idle');
      setGeneratedOrder(null);
      setPlacedOrder(null);
      setError(null);
  };

  const getStatusText = () => {
      switch(currentStatus) {
          case 'pending': return 'Searching for a driver...';
          case 'accepted': return 'Your driver is on the way to the restaurant!';
          case 'picked_up': return 'Your order has been picked up!';
          case 'delivered': return 'Your order has been delivered!';
          default: return 'Order placed.';
      }
  }

  // --- Map Data Transformation ---
  const orderToShowForMap = viewState === 'confirming' ? generatedOrder : viewState === 'tracking' ? placedOrder : null;
  
  const mapItems: MapItem[] = orderToShowForMap ? [
      { id: 'pickup', type: 'pickup', coords: orderToShowForMap.pickupCoords, isHovered: true },
      { id: 'delivery', type: 'delivery', coords: orderToShowForMap.deliveryCoords, isHovered: true }
  ] : [];

  const mapLines: MapLine[] = orderToShowForMap ? [{
      id: 'line',
      from: orderToShowForMap.pickupCoords,
      to: orderToShowForMap.deliveryCoords,
      style: 'dashed'
  }] : [];
  // --- End Map Data Transformation ---

  return (
    <div className="flex flex-col h-full bg-slate-950 p-4 md:p-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-indigo-400" />
              Place an Order
            </h2>
            {viewState !== 'idle' && (
                <button onClick={resetFlow} className="text-sm text-slate-400 hover:text-white">Start Over</button>
            )}
        </div>
        
        {viewState === 'idle' && (
           <div className="text-center py-20 bg-slate-900 border-2 border-dashed border-slate-800 rounded-2xl">
              <h3 className="text-xl font-bold text-white mb-2">Ready to order?</h3>
              <p className="text-slate-400 mb-6">Let's find something to eat.</p>
              <button
                onClick={handleGenerate}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 mx-auto"
              >
                <Search className="w-5 h-5" /> Find Food
              </button>
           </div>
        )}

        {viewState === 'generating' && (
            <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
                <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto mb-4" />
                <p className="text-slate-300">Finding delicious options...</p>
            </div>
        )}
        
        {(viewState === 'confirming' || viewState === 'tracking') && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 animate-in fade-in">
                {viewState === 'confirming' && generatedOrder && (
                     <div>
                        <span className="text-xs text-indigo-400 font-bold">YOUR ORDER FROM</span>
                        <h3 className="text-2xl font-bold text-white">{generatedOrder.restaurant}</h3>
                    </div>
                )}
                
                {viewState === 'tracking' && placedOrder && (
                     <div className="text-center space-y-3 py-8">
                        {currentStatus === 'delivered' ? (
                        <>
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                            <h3 className="text-2xl font-bold text-green-400">Order Delivered!</h3>
                            <p className="text-slate-400">Enjoy your meal from {placedOrder.restaurant}.</p>
                        </>
                        ) : (
                        <>
                            <div className="relative w-20 h-20 mx-auto">
                                <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping"/>
                                <div className="relative w-full h-full bg-indigo-600 rounded-full flex items-center justify-center text-white">
                                    {currentStatus === 'picked_up' ? <Navigation className="w-8 h-8"/> : <Package className="w-8 h-8" />}
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-white pt-2">{getStatusText()}</h3>
                            <p className="text-slate-400">Tracking order #{placedOrder.id.substring(5)}</p>
                        </>
                        )}
                    </div>
                )}

                <div className="h-48 bg-slate-800 rounded-lg relative overflow-hidden border border-slate-700">
                   <SimulatedMapView items={mapItems} lines={mapLines} />
                </div>

                {viewState === 'confirming' && generatedOrder && (
                    <>
                    <ul className="space-y-2">
                        {generatedOrder.items.map((item, i) => (
                        <li key={i} className="p-3 bg-slate-800/50 rounded-md text-sm text-slate-300 border border-slate-700/50">{item}</li>
                        ))}
                    </ul>

                    <div className="flex justify-between items-center text-slate-300 text-sm">
                        <span>Driver Payout</span>
                        <span className="font-bold text-green-400">${generatedOrder.pay.toFixed(2)}</span>
                    </div>
                    <button onClick={handlePlaceOrder} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl text-lg">
                        Place Order
                    </button>
                    </>
                )}
            </div>
        )}

      </div>
    </div>
  );
};

export default CustomerOrderView;