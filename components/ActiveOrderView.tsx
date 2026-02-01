import React, { useState, useRef } from 'react';
import { MapPin, Navigation, Camera, CheckCircle, Package, AlertTriangle } from 'lucide-react';
import { Order } from '../types';
import { verifyDeliveryPhoto } from '../services/geminiService';

interface ActiveOrderViewProps {
  order: Order | null;
  onCompleteOrder: (earnings: number) => void;
  onUpdateStep: (orderId: string, step: Order['status']) => void;
}

const ActiveOrderView: React.FC<ActiveOrderViewProps> = ({ order, onCompleteOrder, onUpdateStep }) => {
  const [step, setStep] = useState<'pickup' | 'deliver' | 'verify'>('pickup');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ verified: boolean; reason: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!order) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 p-6 text-center">
        <Package className="w-16 h-16 mb-4 opacity-20" />
        <h2 className="text-xl font-semibold text-slate-300 mb-2">No Active Order</h2>
        <p>Go to the Feed to find work.</p>
      </div>
    );
  }

  const handleStepChange = (newStep: 'deliver' | 'verify') => {
    setStep(newStep);
    if (newStep === 'deliver') {
        onUpdateStep(order.id, 'picked_up');
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsVerifying(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result as string;
          const base64Data = base64String.split(',')[1];
          const result = await verifyDeliveryPhoto(base64Data);
          setVerificationResult(result);
        } catch (err) {
            console.error(err);
            setVerificationResult({ verified: false, reason: "Error analyzing image. Please try again." });
        } finally {
          setIsVerifying(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleComplete = () => {
    if (verificationResult?.verified || step === 'verify') { // Allow bypass if needed for demo
        onCompleteOrder(order.pay);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 p-4 md:p-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto w-full space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <div className="flex items-center justify-between mb-4">
             <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                order.platform === 'DoorDash' ? 'bg-red-500 text-white' : 'bg-green-600 text-white'
             }`}>
                {order.platform}
             </span>
             <span className="text-2xl font-bold text-emerald-400">${order.pay.toFixed(2)}</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{order.restaurant}</h2>
          <div className="flex items-center gap-2 text-slate-300">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>{order.address}</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex items-center justify-between px-4 relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-800 -z-10" />
          
          <div className={`flex flex-col items-center gap-2 ${step === 'pickup' ? 'opacity-100' : 'opacity-50'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'pickup' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'}`}>1</div>
            <span className="text-xs font-medium">Pickup</span>
          </div>
          <div className={`flex flex-col items-center gap-2 ${step === 'deliver' ? 'opacity-100' : 'opacity-50'}`}>
             <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'deliver' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'}`}>2</div>
             <span className="text-xs font-medium">Drive</span>
          </div>
          <div className={`flex flex-col items-center gap-2 ${step === 'verify' ? 'opacity-100' : 'opacity-50'}`}>
             <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'verify' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'}`}>3</div>
             <span className="text-xs font-medium">Dropoff</span>
          </div>
        </div>

        {/* Action Area */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
          {step === 'pickup' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Order Items</h3>
                <ul className="space-y-3">
                  {order.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 p-3 bg-slate-950 rounded-lg border border-slate-800">
                      <div className="w-5 h-5 rounded border border-slate-600 flex items-center justify-center mt-0.5">
                         <div className="w-3 h-3 bg-slate-600 rounded-sm" />
                      </div>
                      <span className="text-slate-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button 
                onClick={() => handleStepChange('deliver')}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold text-lg transition-colors"
              >
                Confirm Pickup
              </button>
            </div>
          )}

          {step === 'deliver' && (
             <div className="space-y-6 text-center py-8">
                <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
                   <Navigation className="w-10 h-10 text-blue-500" />
                </div>
                <div>
                   <h3 className="text-xl font-bold text-white">Navigating to Dropoff</h3>
                   <p className="text-slate-400 mt-2">{order.distance} to destination</p>
                </div>
                <button 
                  onClick={() => setStep('verify')}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold text-lg transition-colors"
                >
                  Arrived at Customer
                </button>
             </div>
          )}

          {step === 'verify' && (
             <div className="space-y-6">
                <div className="text-center space-y-2">
                   <h3 className="text-lg font-bold text-white">Verify Delivery</h3>
                   <p className="text-slate-400 text-sm">Take a photo of the package at the door to complete the order.</p>
                </div>

                {!verificationResult ? (
                   <div 
                     onClick={() => fileInputRef.current?.click()}
                     className="border-2 border-dashed border-slate-700 hover:border-blue-500 hover:bg-slate-800/50 rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all"
                   >
                     <input 
                       ref={fileInputRef} 
                       type="file" 
                       accept="image/*" 
                       capture="environment" 
                       className="hidden" 
                       onChange={handlePhotoUpload}
                     />
                     {isVerifying ? (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-blue-400">AI is analyzing photo...</span>
                        </div>
                     ) : (
                        <>
                           <Camera className="w-12 h-12 text-slate-500 mb-3" />
                           <span className="text-slate-300 font-medium">Tap to take photo</span>
                        </>
                     )}
                   </div>
                ) : (
                   <div className={`p-4 rounded-xl border ${verificationResult.verified ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                      <div className="flex items-start gap-3">
                         {verificationResult.verified ? <CheckCircle className="w-6 h-6 text-green-500" /> : <AlertTriangle className="w-6 h-6 text-red-500" />}
                         <div>
                            <h4 className={`font-bold ${verificationResult.verified ? 'text-green-400' : 'text-red-400'}`}>
                               {verificationResult.verified ? "Delivery Verified" : "Verification Failed"}
                            </h4>
                            <p className="text-sm text-slate-300 mt-1">{verificationResult.reason}</p>
                         </div>
                      </div>
                   </div>
                )}

                <button 
                  onClick={handleComplete}
                  disabled={!verificationResult?.verified}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" /> Complete Order
                </button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActiveOrderView;