import React, { useState, useRef } from 'react';
import { Plus, Camera, MapPin, DollarSign, Navigation, Check, Trash2, ArrowRight, Loader2, Zap, TrendingUp, Sparkles, Lightbulb, LocateFixed, X, Clock, Fuel, CheckCircle, Layers, XCircle, BrainCircuit } from 'lucide-react';
import { Job, Settings } from '../types';
import { parseOfferScreenshot, optimizeRouteStack, analyzeStackBundle, StackAnalysisResult, analyzeManualOrder } from '../services/geminiService';

interface ActiveShiftViewProps {
  jobs: Job[];
  onAddJob: (job: Job) => void;
  onUpdateJobs: (updatedJobs: Job[]) => void;
  onCompleteJob: (id: string) => void;
  trackedMiles: number;
  settings: Settings;
  onStartLiveTracking: () => void;
}

interface AnalysisResult {
  recommendation: 'Take' | 'Stack' | 'Decline';
  reasoning: string;
  dollarsPerMile: number;
  dollarsPerHour: number;
  fuelAdjustedProfit: number;
}

const ActiveShiftView: React.FC<ActiveShiftViewProps> = ({ jobs, onAddJob, onUpdateJobs, onCompleteJob, trackedMiles, settings, onStartLiveTracking }) => {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isProcessingScreenshot, setIsProcessingScreenshot] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingOffer, setIsAnalyzingOffer] = useState(false);

  const [stackAnalysisResult, setStackAnalysisResult] = useState<StackAnalysisResult | null>(null);
  const [manualAnalysisResult, setManualAnalysisResult] = useState<AnalysisResult | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const initialNewJobState: Partial<Job> = {
    platform: 'UberEats', restaurant: '', pay: undefined, distance: undefined, address: '', estimatedTime: undefined
  };
  const [newJob, setNewJob] = useState<Partial<Job>>(initialNewJobState);

  const resetAssistant = () => {
    setNewJob(initialNewJobState);
    setManualAnalysisResult(null);
    setIsAssistantOpen(false);
  };

  const handleScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingScreenshot(true);
      setNewJob(initialNewJobState);
      setManualAnalysisResult(null);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result as string;
          const base64Data = base64String.split(',')[1];
          const extractedData = await parseOfferScreenshot(base64Data);
          setNewJob(prev => ({ ...prev, ...extractedData }));
          setIsAssistantOpen(true); // Open assistant with pre-filled data
        } catch (err) {
          console.error(err);
          alert("Failed to analyze screenshot. Please try manual entry.");
        } finally {
          setIsProcessingScreenshot(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeOffer = async () => {
    const { pay, distance, estimatedTime } = newJob;
    if (!pay || !distance || !estimatedTime) {
      alert("Please fill in Payout, Distance, and Estimated Time.");
      return;
    }

    setIsAnalyzingOffer(true);
    setManualAnalysisResult(null);

    try {
      // 1. Local Calculations
      const dollarsPerMile = distance > 0 ? pay / distance : 0;
      const dollarsPerHour = estimatedTime > 0 ? pay / (estimatedTime / 60) : 0;
      
      let fuelAdjustedProfit;
      if (settings.mpg > 0 && settings.fuelCost > 0) {
        const fuelCostForTrip = (distance / settings.mpg) * settings.fuelCost;
        fuelAdjustedProfit = pay - fuelCostForTrip;
      } else {
        // Fallback to IRS rate if settings are invalid
        fuelAdjustedProfit = pay - (distance * 0.67);
      }
      
      // 2. AI Recommendation
      const aiResult = await analyzeManualOrder({ pay, distance, estimatedTime });

      // 3. Set state
      setManualAnalysisResult({
        ...aiResult,
        dollarsPerMile,
        dollarsPerHour,
        fuelAdjustedProfit,
      });

    } catch (e) {
      console.error(e);
      alert("Failed to analyze offer.");
    } finally {
      setIsAnalyzingOffer(false);
    }
  };


  const handleOptimize = async () => {
    if (jobs.length < 2) return;
    setIsOptimizing(true);
    try {
      const activeJobs = jobs.filter(j => j.status === 'active');
      const optimized = await optimizeRouteStack(activeJobs);
      
      const completed = jobs.filter(j => j.status !== 'active');
      onUpdateJobs([...optimized, ...completed]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleStackAnalysis = async () => {
    const activeJobs = jobs.filter(j => j.status === 'active');
    if (activeJobs.length < 2) return;
    
    setIsAnalyzing(true);
    try {
        const result = await analyzeStackBundle(activeJobs);
        setStackAnalysisResult(result);
    } catch (e) {
        console.error(e);
        alert("Failed to analyze stack.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const dismissAnalysis = () => setStackAnalysisResult(null);

  const submitJob = () => {
    if (!newJob.restaurant || !newJob.pay) return;
    
    const job: Job = {
      id: Date.now().toString(),
      platform: newJob.platform as any,
      restaurant: newJob.restaurant!,
      pay: Number(newJob.pay),
      distance: Number(newJob.distance),
      address: newJob.address || 'Unknown',
      status: 'active',
      timestamp: Date.now(),
      profitScore: newJob.profitScore,
      estimatedTime: newJob.estimatedTime,
    };

    onAddJob(job);
    resetAssistant();
  };

  const activeJobs = jobs.filter(j => j.status === 'active');
  const completedJobs = jobs.filter(j => j.status === 'completed');

  // Profit Calculator Logic
  const totalProjectedPay = activeJobs.reduce((sum, j) => sum + j.pay, 0);
  const totalProjectedDistance = activeJobs.reduce((sum, j) => sum + j.distance, 0);
  const avgDollarsPerMile = totalProjectedDistance > 0 
    ? (totalProjectedPay / totalProjectedDistance).toFixed(2) 
    : "0.00";

  const getRecommendationIcon = (rec: 'Take' | 'Stack' | 'Decline') => {
    switch(rec) {
      case 'Take': return <CheckCircle className="w-8 h-8 text-green-400" />;
      case 'Stack': return <Layers className="w-8 h-8 text-yellow-400" />;
      case 'Decline': return <XCircle className="w-8 h-8 text-red-400" />;
    }
  };
  const getRecommendationColor = (rec: 'Take' | 'Stack' | 'Decline') => {
     switch(rec) {
      case 'Take': return 'border-green-500/50 bg-green-500/10 text-green-300';
      case 'Stack': return 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300';
      case 'Decline': return 'border-red-500/50 bg-red-500/10 text-red-300';
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 p-4 md:p-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        
        {/* Controls */}
        <div className="flex gap-2">
          <button 
            onClick={() => {
              if (isAssistantOpen) resetAssistant();
              else setIsAssistantOpen(true);
            }}
            className={`flex-1 p-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              isAssistantOpen ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {isAssistantOpen ? <X className="w-5 h-5"/> : <Plus className="w-5 h-5" />}
            {isAssistantOpen ? 'Close Assistant' : 'Order Assistant'}
          </button>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessingScreenshot}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 p-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
          >
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleScreenshot}
            />
            {isProcessingScreenshot ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
            Scan Screenshot
          </button>
        </div>

        {/* Order Assistant Panel */}
        {isAssistantOpen && (
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl animate-in fade-in slide-in-from-top-4 space-y-6">
            <h3 className="font-bold text-slate-100 text-lg">Order Assistant</h3>
            
            {/* Input Form */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500">Platform</label>
                  <select 
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white mt-1"
                    value={newJob.platform}
                    onChange={e => setNewJob({...newJob, platform: e.target.value as any})}
                  >
                    <option value="UberEats">UberEats</option>
                    <option value="DoorDash">DoorDash</option>
                    <option value="GrubHub">GrubHub</option>
                  </select>
                </div>
                 <div>
                  <label className="text-xs text-slate-500">Restaurant</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Taco Bell"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white mt-1"
                    value={newJob.restaurant || ''}
                    onChange={e => setNewJob({...newJob, restaurant: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-500">Payout ($)</label>
                  <input 
                    type="number"
                    placeholder="12.50"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white mt-1"
                    value={newJob.pay || ''}
                    onChange={e => setNewJob({...newJob, pay: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Distance (mi)</label>
                  <input 
                    type="number" 
                    placeholder="5.2"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white mt-1"
                    value={newJob.distance || ''}
                    onChange={e => setNewJob({...newJob, distance: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Time (min)</label>
                  <input 
                    type="number" 
                    placeholder="25"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white mt-1"
                    value={newJob.estimatedTime || ''}
                    onChange={e => setNewJob({...newJob, estimatedTime: parseInt(e.target.value)})}
                  />
                </div>
              </div>
            </div>

            {!manualAnalysisResult && (
              <button onClick={handleAnalyzeOffer} disabled={isAnalyzingOffer} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                 {isAnalyzingOffer ? <Loader2 className="w-5 h-5 animate-spin"/> : <BrainCircuit className="w-5 h-5" />}
                 Analyze Offer
              </button>
            )}

            {/* Analysis Result */}
            {manualAnalysisResult && (
              <div className="space-y-4 animate-in fade-in">
                <div className={`p-4 rounded-xl border flex items-center gap-4 ${getRecommendationColor(manualAnalysisResult.recommendation)}`}>
                   {getRecommendationIcon(manualAnalysisResult.recommendation)}
                   <div>
                      <h4 className="font-bold text-lg">{manualAnalysisResult.recommendation} Offer</h4>
                      <p className="text-sm opacity-90">{manualAnalysisResult.reasoning}</p>
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                   <div className="bg-slate-800 p-3 rounded-lg"><span className="text-xs text-slate-400 block">$/Mile</span><span className="font-bold text-white text-lg">${manualAnalysisResult.dollarsPerMile.toFixed(2)}</span></div>
                   <div className="bg-slate-800 p-3 rounded-lg"><span className="text-xs text-slate-400 block">$/Hour</span><span className="font-bold text-white text-lg">${manualAnalysisResult.dollarsPerHour.toFixed(2)}</span></div>
                   <div className="bg-slate-800 p-3 rounded-lg"><span className="text-xs text-slate-400 block">Profit</span><span className="font-bold text-green-400 text-lg">${manualAnalysisResult.fuelAdjustedProfit.toFixed(2)}</span></div>
                </div>

                <div className="flex gap-2">
                  <button onClick={resetAssistant} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold">Clear</button>
                  <button onClick={submitJob} className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold">Add to Stack</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Profit & GPS Calculator */}
        <div className="grid grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-2">
          {activeJobs.length > 0 && (
            <>
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-2 opacity-10">
                    <DollarSign className="w-6 h-6 text-green-400" />
                 </div>
                 <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold mb-1">Stack Value</p>
                 <p className="text-xl font-bold text-white">${totalProjectedPay.toFixed(2)}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-2 opacity-10">
                    <TrendingUp className="w-6 h-6 text-indigo-400" />
                 </div>
                 <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold mb-1">$/Mile</p>
                 <p className={`text-xl font-bold ${Number(avgDollarsPerMile) >= 2 ? 'text-green-400' : Number(avgDollarsPerMile) >= 1 ? 'text-yellow-400' : 'text-orange-400'}`}>
                    ${avgDollarsPerMile}
                 </p>
              </div>
            </>
          )}
          <div className={`bg-slate-900 border border-slate-800 p-3 rounded-xl relative overflow-hidden flex items-center justify-between ${activeJobs.length === 0 ? 'col-span-3' : ''}`}>
             <div className="flex-1">
                <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold mb-1 flex items-center gap-1">
                Live Trip Meter
                </p>
                <div className="flex items-baseline gap-1">
                <p className="text-xl font-bold text-white">{trackedMiles.toFixed(2)}</p>
                <span className="text-xs text-slate-500">mi</span>
                </div>
             </div>
             <button onClick={onStartLiveTracking} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 transition-colors">
                <LocateFixed className="w-5 h-5" />
             </button>
          </div>
        </div>

        {/* Stack Analysis Result */}
        {stackAnalysisResult && (
           <div className="bg-slate-800 border-l-4 border-indigo-500 p-4 rounded-r-lg animate-in slide-in-from-right-10 relative">
             <button onClick={dismissAnalysis} className="absolute top-2 right-2 text-slate-400 hover:text-white"><Trash2 className="w-4 h-4" /></button>
             <div className="flex items-start gap-3">
                <Sparkles className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />
                <div>
                   <h3 className="font-bold text-lg text-indigo-100 mb-1">Stack Recommendation</h3>
                   <div className="flex items-center gap-2 mb-2">
                     <span className={`px-2 py-0.5 rounded text-xs font-bold ${stackAnalysisResult.efficiencyRating === 'High' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {stackAnalysisResult.efficiencyRating} Efficiency
                     </span>
                     <span className="text-xs text-slate-400">Est. Pay: ${stackAnalysisResult.totalProjectedPay}</span>
                   </div>
                   <p className="text-sm text-slate-300 mb-2">{stackAnalysisResult.reasoning}</p>
                   <div className="flex items-start gap-2 bg-slate-900/50 p-2 rounded">
                      <Lightbulb className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-yellow-200 italic">{stackAnalysisResult.strategyTip}</p>
                   </div>
                   <p className="text-xs text-slate-500 mt-2">Recommended IDs: {stackAnalysisResult.recommendedJobIds.join(', ')}</p>
                </div>
             </div>
           </div>
        )}

        {/* Active Stack */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" /> Current Stack
            </h2>
            <div className="flex gap-2">
              {activeJobs.length > 1 && (
                <button 
                    onClick={handleStackAnalysis}
                    disabled={isAnalyzing}
                    className="text-xs bg-purple-500/10 text-purple-400 px-3 py-1.5 rounded-lg font-medium hover:bg-purple-500/20 flex items-center gap-1 border border-purple-500/30"
                >
                    {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Analyze Bundle
                </button>
              )}
              {activeJobs.length > 1 && (
                <button 
                  onClick={handleOptimize}
                  disabled={isOptimizing}
                  className="text-xs bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-500/20 flex items-center gap-1 border border-indigo-500/30"
                >
                  {isOptimizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
                  Optimize Route
                </button>
              )}
            </div>
          </div>

          {activeJobs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-800">
              <Navigation className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No active jobs. Use the Assistant or Scan to start.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeJobs.map((job, index) => {
                const isRecommended = stackAnalysisResult?.recommendedJobIds.includes(job.id);
                const isRejected = stackAnalysisResult && !isRecommended;
                
                return (
                <div key={job.id} className={`bg-slate-900 border ${isRecommended ? 'border-indigo-500 ring-1 ring-indigo-500/50' : isRejected ? 'border-slate-800 opacity-50' : 'border-slate-800'} rounded-xl p-4 relative group hover:border-slate-700 transition-all`}>
                  <div className="absolute top-4 right-4 flex flex-col items-end">
                    <span className="text-xl font-bold text-green-400">${job.pay.toFixed(2)}</span>
                    <span className="text-xs text-slate-500">{job.distance} mi</span>
                  </div>

                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 border border-slate-700">
                      {index + 1}
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      job.platform === 'DoorDash' ? 'bg-red-500/20 text-red-400' : 
                      job.platform === 'UberEats' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
                    }`}>
                      {job.platform}
                    </span>
                    {job.profitScore && job.profitScore >= 8 && (
                      <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-500/20">
                        High Value
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">{job.restaurant}</h3>
                  <p className="text-sm text-slate-400 flex items-center gap-1 mb-4">
                    <MapPin className="w-3 h-3" /> {job.address}
                  </p>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => onCompleteJob(job.id)}
                      className="flex-1 bg-slate-800 hover:bg-green-600/20 hover:text-green-400 hover:border-green-600/30 border border-slate-700 text-slate-300 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" /> Complete
                    </button>
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>

        {/* Recent History */}
        {completedJobs.length > 0 && (
          <div className="pt-8 border-t border-slate-800">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Completed Today</h3>
            <div className="space-y-2 opacity-60">
               {completedJobs.map(job => (
                 <div key={job.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                    <span className="text-sm text-slate-300">{job.restaurant}</span>
                    <span className="text-sm font-mono text-green-500">+${job.pay.toFixed(2)}</span>
                 </div>
               ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ActiveShiftView;