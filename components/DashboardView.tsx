import React, { useState, useEffect } from 'react';
import { DollarSign, MapPin, Clock, TrendingUp, BarChart, Sparkles, AlertTriangle, FileText, Bot, Flame, BrainCircuit, Loader2 } from 'lucide-react';
import { ShiftStats, Job, EarningsAnalysisResult, Settings } from '../types';
import { analyzeEarningsData } from '../services/geminiService';

interface AnalyticsViewProps {
  stats: ShiftStats;
  jobs: Job[];
  settings: Settings;
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ stats, jobs, settings }) => {
  const [timePeriod, setTimePeriod] = useState<'day' | 'week' | 'month'>('week');
  const [analysis, setAnalysis] = useState<EarningsAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const completedJobs = jobs.filter(j => j.status === 'completed');

  useEffect(() => {
    const performAnalysis = async () => {
      if (completedJobs.length > 0) {
        setIsAnalyzing(true);
        try {
          const result = await analyzeEarningsData(completedJobs);
          setAnalysis(result);
        } catch (e) {
          console.error("Failed to get earnings analysis", e);
        } finally {
          setIsAnalyzing(false);
        }
      }
    };
    if (completedJobs.length > 0) {
        performAnalysis();
    } else {
        setAnalysis(null);
    }
  }, [jobs]); // Re-run when jobs data changes

  const taxDeduction = stats.totalMiles * 0.67; // 2024 IRS Rate
  const estTaxOwed = stats.totalEarnings * (settings.taxRate / 100);
  const profitPerHour = stats.activeTimeInHours > 0 ? (stats.totalEarnings / stats.activeTimeInHours) : 0;

  // Mock data for chart visualization
  const chartData = {
    week: [
      { label: 'Mon', value: 30 }, { label: 'Tue', value: 85 }, { label: 'Wed', value: 45 },
      { label: 'Thu', value: 60 }, { label: 'Fri', value: 120 }, { label: 'Sat', value: 150 },
      { label: 'Sun', value: 90 }
    ],
    day: [
        { label: '8a', value: 10 }, { label: '10a', value: 25 }, { label: '12p', value: 45 },
        { label: '2p', value: 30 }, { label: '5p', value: 70 }, { label: '7p', value: 90 }, { label: '9p', value: 50 }
    ],
    month: [
        { label: 'W1', value: 350 }, { label: 'W2', value: 420 }, { label: 'W3', value: 510 }, { label: 'W4', value: 480 }
    ]
  };
  const currentChartData = chartData[timePeriod];
  const maxChartValue = Math.max(...currentChartData.map(d => d.value));

  const getPlatformColor = (platform: string) => {
    switch(platform) {
      case 'UberEats': return 'bg-green-500';
      case 'DoorDash': return 'bg-red-500';
      case 'GrubHub': return 'bg-orange-500';
      default: return 'bg-slate-500';
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 p-4 md:p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-100 flex items-center gap-2">
              <BarChart className="w-7 h-7 text-indigo-400"/>
              Earnings Analytics
            </h2>
            <p className="text-slate-400">Your performance and insights overview.</p>
          </div>
          <div className="bg-slate-900 border border-slate-700/50 rounded-lg p-1 flex items-center self-start">
            {(['day', 'week', 'month'] as const).map(period => (
              <button 
                key={period}
                onClick={() => setTimePeriod(period)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${
                  timePeriod === period ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
        
        {/* Main Chart & Key Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
             <h3 className="text-lg font-bold text-slate-100 mb-4 capitalize">{timePeriod}ly Earnings</h3>
             <div className="h-64 flex items-end justify-between gap-2">
                {currentChartData.map(d => (
                    <div key={d.label} className="flex-1 flex flex-col items-center gap-2 group">
                        <div className="relative w-full h-full flex items-end justify-center">
                            <div 
                                style={{ height: `${(d.value / maxChartValue) * 100}%` }}
                                className="w-3/4 bg-gradient-to-t from-indigo-600 to-indigo-500 rounded-t-lg group-hover:from-purple-600 group-hover:to-purple-500 transition-all duration-300"
                            />
                            <span className="absolute -top-6 text-xs font-bold text-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">${d.value}</span>
                        </div>
                        <span className="text-xs text-slate-500">{d.label}</span>
                    </div>
                ))}
             </div>
          </div>
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                <p className="text-slate-400 text-sm">Total Earnings</p>
                <p className="text-3xl font-bold text-green-400">${stats.totalEarnings.toFixed(2)}</p>
            </div>
             <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                <p className="text-slate-400 text-sm">Profit / Hour</p>
                <p className="text-3xl font-bold text-slate-100">${profitPerHour.toFixed(2)}</p>
            </div>
             <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                <p className="text-slate-400 text-sm">Total Mileage</p>
                <p className="text-3xl font-bold text-slate-100">{stats.totalMiles.toFixed(1)} mi</p>
            </div>
          </div>
        </div>

        {/* AI Insights & Tax Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400"/>
                    AI-Powered Insights
                </h3>
                {isAnalyzing && (
                    <div className="flex items-center justify-center h-48 text-slate-500">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                )}
                {!isAnalyzing && !analysis && (
                    <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500">
                        <BrainCircuit className="w-10 h-10 mb-3"/>
                        <p>Complete some jobs to generate insights.</p>
                    </div>
                )}
                {analysis && (
                    <div className="space-y-4 animate-in fade-in">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-800/50 p-4 rounded-lg">
                                <p className="text-xs text-slate-400 flex items-center gap-1 mb-1"><Clock className="w-3 h-3"/> Best Hours</p>
                                <p className="font-bold text-slate-100">{analysis.bestHours}</p>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded-lg">
                                <p className="text-xs text-slate-400 flex items-center gap-1 mb-1"><Flame className="w-3 h-3"/> Hot Zones</p>
                                <p className="font-bold text-slate-100 truncate">{analysis.bestZones.join(', ')}</p>
                            </div>
                        </div>
                        <div>
                             <p className="text-xs text-slate-400 mb-2">Platform Performance</p>
                             <div className="w-full flex h-8 rounded-lg overflow-hidden border border-slate-700">
                                {analysis.platformComparison.map(p => (
                                    <div key={p.platform} style={{ width: `${p.percentage}%`}} className={`group relative h-full transition-all duration-300 ${getPlatformColor(p.platform)}`}>
                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max bg-slate-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            {p.platform}: ${p.totalEarnings.toFixed(2)} ({p.percentage}%)
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                        <div className="bg-gradient-to-r from-slate-800 to-slate-800/50 p-4 rounded-lg border-l-4 border-indigo-500">
                            <p className="text-sm font-semibold text-indigo-200 mb-1">Efficiency Tip from GigSync AI</p>
                            <p className="text-sm text-slate-300">{analysis.efficiencyTip}</p>
                        </div>
                    </div>
                )}
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-400"/>
                    Tax-Ready Summary
                </h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400">Total Earnings</span>
                        <span className="font-mono text-lg text-slate-100">${stats.totalEarnings.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-slate-400">Total Miles Driven</span>
                        <span className="font-mono text-lg text-slate-100">{stats.totalMiles.toFixed(1)} mi</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400">Est. Mileage Deduction</span>
                        <span className="font-mono text-lg text-green-400">${taxDeduction.toFixed(2)}</span>
                    </div>
                     <div className="border-t border-slate-800 my-1"></div>
                     <div className="flex justify-between items-center">
                        <span className="text-slate-200 font-semibold">Estimated Tax Owed ({settings.taxRate}%)</span>
                        <span className="font-mono text-xl text-red-400 font-bold">${estTaxOwed.toFixed(2)}</span>
                    </div>
                     <p className="text-xs text-slate-500 text-center pt-2">
                        Based on the 2024 IRS standard mileage rate of $0.67 per mile. This is not financial advice.
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;