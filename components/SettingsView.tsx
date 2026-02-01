import React, { useState, useEffect, useRef } from 'react';
import { Settings } from '../types';
import { Fuel, Percent, Bell, Car, Check, Save } from 'lucide-react';

interface SettingsViewProps {
  settings: Settings;
  onSettingsChange: (newSettings: Settings) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSettingsChange }) => {
  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const [showSaved, setShowSaved] = useState(false);
  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    // Debounce the save operation
    if (JSON.stringify(localSettings) === JSON.stringify(settings)) return;

    const handler = setTimeout(() => {
      onSettingsChange(localSettings);
      setShowSaved(true);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = window.setTimeout(() => setShowSaved(false), 2000);
    }, 1000);

    return () => clearTimeout(handler);
  }, [localSettings, onSettingsChange, settings]);

  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalSettings(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleToggleChange = (name: keyof Settings['notifications']) => {
    setLocalSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [name]: !prev.notifications[name],
      },
    }));
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 p-4 md:p-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto w-full space-y-8">
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-3xl font-bold text-slate-100 flex items-center gap-2">
                <Car className="w-7 h-7 text-indigo-400" />
                Settings
                </h2>
                <p className="text-slate-400">Personalize your GigSync experience.</p>
            </div>
            <div className={`flex items-center gap-2 text-green-400 transition-opacity duration-300 ${showSaved ? 'opacity-100' : 'opacity-0'}`}>
                <Check className="w-5 h-5" />
                <span className="font-medium text-sm">Saved!</span>
            </div>
        </div>
        
        {/* Profitability Settings */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
                <Fuel className="w-5 h-5 text-green-400" />
                Profitability
            </h3>
            <div className="space-y-6">
                <div>
                    <label htmlFor="mpg" className="block text-sm font-medium text-slate-300 mb-2">Vehicle MPG</label>
                    <div className="relative">
                        <input
                            type="number"
                            id="mpg"
                            name="mpg"
                            value={localSettings.mpg}
                            onChange={handleNumericChange}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 pl-10 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g., 25"
                        />
                        <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    </div>
                </div>
                <div>
                    <label htmlFor="fuelCost" className="block text-sm font-medium text-slate-300 mb-2">Fuel Cost ($/gallon)</label>
                    <div className="relative">
                        <input
                            type="number"
                            id="fuelCost"
                            name="fuelCost"
                            step="0.01"
                            value={localSettings.fuelCost}
                            onChange={handleNumericChange}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 pl-10 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g., 3.50"
                        />
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                    </div>
                </div>
                 <div>
                    <label htmlFor="taxRate" className="block text-sm font-medium text-slate-300 mb-2">Estimated Tax Rate</label>
                    <div className="relative">
                        <input
                            type="number"
                            id="taxRate"
                            name="taxRate"
                            value={localSettings.taxRate}
                            onChange={handleNumericChange}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 pl-10 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g., 15"
                        />
                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    </div>
                </div>
            </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
             <h3 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
                <Bell className="w-5 h-5 text-purple-400" />
                Notifications
            </h3>
            <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <div>
                        <h4 className="font-medium text-slate-200">High Value Alerts</h4>
                        <p className="text-xs text-slate-500">Notify me about profitable orders nearby.</p>
                    </div>
                    <button
                        onClick={() => handleToggleChange('highValueAlerts')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            localSettings.notifications.highValueAlerts ? 'bg-indigo-600' : 'bg-slate-700'
                        }`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            localSettings.notifications.highValueAlerts ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                    </button>
                </div>
                 <div className="flex justify-between items-center bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <div>
                        <h4 className="font-medium text-slate-200">Shift Reminders</h4>
                        <p className="text-xs text-slate-500">Remind me to start driving during peak hours.</p>
                    </div>
                    <button
                        onClick={() => handleToggleChange('shiftReminders')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            localSettings.notifications.shiftReminders ? 'bg-indigo-600' : 'bg-slate-700'
                        }`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            localSettings.notifications.shiftReminders ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                    </button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsView;