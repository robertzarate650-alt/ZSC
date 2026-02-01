import React, { useState, useEffect } from 'react';
import { DollarSign, Map, Clock, Gauge, Flame, ArrowRight, BrainCircuit, Loader2, TrendingUp } from 'lucide-react';
import { ShiftStats, Job, EarningsForecast } from '../types';
import { getEarningsForecast } from '../services/geminiService';

interface HomeDashboardViewProps {
  stats: ShiftStats;
  jobs: Job[];
  onStartShift: () => void;
}

const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({ stats, jobs, onStartShift }) => {
  const [forecast, setForecast] = useState<EarningsForecast | null>(null);
  const [isForecasting, setIsForecasting] = useState(false);

  const profitPerHour = stats.activeTimeInHours > 0 
    ? (stats.totalEarnings / stats.activeTimeInHours).toFixed(2)
    : "0.00";

  useEffect(() => {
    const fetchForecast = async () => {
      setIsForecasting(true);
      try {
        const completedJobs = jobs.filter(j => j.status === 'completed');
        const result = await getEarningsForecast(completedJobs, new Date());
        setForecast(result);
      } catch (e) {
        console.error("Failed to fetch earnings forecast", e);
        // Set a default/error state if needed
      } finally {
        setIsForecasting(false);
      }
    };
    fetchForecast();
  }, [jobs]);

  return (
    <div className="flex flex-col h-full bg-slate-950 p-4 md:p-6 overflow-y-auto">
      <div className="max-w-md mx-auto w-full flex flex-col flex-1">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Welcome, Driver</h1>
            <p className="text-slate-400">Here's your pre-shift summary.</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-700 border-2 border-slate-600">
             {/* Profile Pic Placeholder */}
          </div>
        </div>

        {/* AI Forecast Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-indigo-600/20 to-transparent rounded-full blur-2xl" />
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
               <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <div>
                <h3 className="font-bold text-slate-100">AI Earnings Forecast</h3>
                <p className="text-xs text-slate-400">Next 2 hours</p>
            </div>
          </div>

          <div className="my-6 text-center">
            {isForecasting ? (
              <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto" />
            ) : forecast ? (
              <>
                <p className="text-5xl font-extrabold text-white tracking-tight">
                    ${forecast.predictedRate.toFixed(2)}<span className="text-2xl text-slate-400">/hr</span>
                </p>
                <p className="text-sm text-indigo-300 mt-2 h-10">{forecast.reasoning}</p>
              </>
            ) : (
              <p className="text-slate-500">No forecast data available.</p>
            )}
          </div>

          {forecast && !isForecasting && (
             <div className="text-xs text-slate-500 text-center bg-slate-800/50 p-2 rounded-md">
                Next Peak: <span className="font-bold text-slate-300">{forecast.peakTime}</span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs font-medium">Last Earnings</span>
            </div>
            <p className="text-2xl font-bold text-slate-100">${stats.totalEarnings.toFixed(2)}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Map className="w-4 h-4" />
              <span className="text-xs font-medium">Last Mileage</span>
            </div>
            <p className="text-2xl font-bold text-slate-100">{stats.totalMiles.toFixed(1)} <span className="text-lg">mi</span></p>
          </div>
           <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl col-span-2">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Gauge className="w-4 h-4" />
              <span className="text-xs font-medium">Last Profit / Hour</span>
            </div>
            <p className="text-2xl font-bold text-green-400">${profitPerHour}</p>
          </div>
        </div>
        
        {/* CTA */}
        <div className="mt-auto pb-4">
            <button 
                onClick={onStartShift}
                className="w-full bg-green-600 hover:bg-green-500 text-white p-5 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-600/20"
            >
                Start Shift <ArrowRight className="w-5 h-5" />
            </button>
        </div>

      </div>
    </div>
  );
};

export default HomeDashboardView;