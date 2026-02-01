import React, { useState } from 'react';
import { CreditCard, CheckCircle, Zap, BarChart3, FileText, Sparkles, Star } from 'lucide-react';

const BillingView: React.FC = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsSubscribed(true);
      setIsLoading(false);
    }, 1500);
  };

  const handleCancel = () => {
    // In a real app, you'd show a confirmation modal here.
    setIsLoading(true);
    setTimeout(() => {
      setIsSubscribed(false);
      setIsLoading(false);
    }, 1500);
  };

  const proFeatures = [
    { icon: Sparkles, text: "Unlimited AI Offer Analysis" },
    { icon: Zap, text: "Smart Route Optimization" },
    { icon: BarChart3, text: "Advanced Earnings Analytics" },
    { icon: FileText, text: "Tax-Ready Reports" },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950 p-4 md:p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-100 flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-indigo-400" />
            Subscription & Billing
          </h2>
          <p className="text-slate-400">Manage your GigSync plan and features.</p>
        </div>

        {/* Current Plan */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-slate-100 mb-4">Your Current Plan</h3>
          {isSubscribed ? (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                   <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg">
                     <Star className="w-5 h-5 text-white" />
                   </div>
                   <div>
                     <h4 className="font-bold text-xl text-white">GigSync Pro</h4>
                     <p className="text-slate-400">$9.99 / month</p>
                   </div>
                </div>
                <p className="text-sm text-slate-400">Your subscription will renew on <span className="font-medium text-slate-200">July 28, 2024</span>.</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300 mb-2">Pro Features Unlocked:</p>
                <ul className="space-y-2 text-sm text-slate-400">
                    {proFeatures.map(f => (
                        <li key={f.text} className="flex items-center gap-2">
                            <f.icon className="w-4 h-4 text-green-400" /> {f.text}
                        </li>
                    ))}
                </ul>
                <button 
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="w-full mt-6 bg-red-900/50 hover:bg-red-900/80 text-red-300 border border-red-500/30 py-2 rounded-lg font-medium transition-colors text-sm"
                >
                  {isLoading ? 'Cancelling...' : 'Cancel Subscription'}
                </button>
              </div>
            </div>
          ) : (
             <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                <div>
                  <h4 className="font-bold text-xl text-white">Free Tier</h4>
                  <p className="text-slate-400 mt-1">You are currently on the free plan with basic features.</p>
                </div>
                <button 
                    onClick={handleSubscribe}
                    disabled={isLoading}
                    className="w-full md:w-auto bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2"
                >
                    <Star className="w-4 h-4" /> Upgrade to Pro
                </button>
             </div>
          )}
        </div>

        {/* Plan Comparison */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-100">Compare Plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free Plan Card */}
            <div className={`p-6 rounded-2xl border-2 ${!isSubscribed ? 'border-indigo-500 bg-slate-900' : 'border-slate-800 bg-slate-900/50'}`}>
              <h4 className="font-bold text-2xl text-white mb-2">Free</h4>
              <p className="text-slate-400 text-sm h-12">Basic tools to get you started on the road.</p>
              <p className="text-4xl font-bold my-4">$0 <span className="text-lg font-medium text-slate-400">/ month</span></p>
              <button disabled className="w-full py-3 rounded-lg font-bold bg-slate-800 text-slate-400 border border-slate-700">
                {!isSubscribed ? 'Your Current Plan' : 'Basic Access'}
              </button>
              <ul className="space-y-3 text-sm text-slate-300 mt-6">
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" /> 5 AI Offer Analyses / day</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" /> Basic Mileage Tracking</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" /> Daily Earnings Summary</li>
              </ul>
            </div>

            {/* Pro Plan Card */}
            <div className={`p-6 rounded-2xl border-2 relative overflow-hidden ${isSubscribed ? 'border-indigo-500 bg-slate-900' : 'border-slate-800 bg-slate-900/50'}`}>
                {isSubscribed && (
                    <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">Current Plan</div>
                )}
                <h4 className="font-bold text-2xl text-white mb-2">Pro</h4>
                <p className="text-slate-400 text-sm h-12">Unlock the full power of GigSync to maximize your earnings.</p>
                <p className="text-4xl font-bold my-4">$9.99 <span className="text-lg font-medium text-slate-400">/ month</span></p>
                <button 
                    onClick={handleSubscribe}
                    disabled={isSubscribed || isLoading}
                    className="w-full py-3 rounded-lg font-bold bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed text-white transition-colors"
                >
                    {isSubscribed ? 'Subscribed' : isLoading ? 'Processing...' : 'Upgrade to Pro'}
                </button>
                <ul className="space-y-3 text-sm text-slate-300 mt-6">
                    {proFeatures.map(f => (
                        <li key={f.text} className="flex items-start gap-2">
                           <f.icon className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" /> {f.text}
                        </li>
                    ))}
                </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingView;