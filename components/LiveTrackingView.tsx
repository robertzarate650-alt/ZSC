import React, { useState, useEffect, useRef } from 'react';
import { X, Map, Gauge, Timer } from 'lucide-react';
import SimulatedMapView, { MapItem } from './SimulatedMapView';

interface LiveTrackingViewProps {
  initialMiles: number;
  onEndTracking: () => void;
}

const LiveTrackingView: React.FC<LiveTrackingViewProps> = ({ initialMiles, onEndTracking }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [simulatedPosition, setSimulatedPosition] = useState({ x: 50, y: 50 });
  const [simulatedSpeed, setSimulatedSpeed] = useState(45);
  const [simulatedMiles, setSimulatedMiles] = useState(initialMiles);

  const animationRef = useRef<number>();

  useEffect(() => {
    const timerInterval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    // Simulate movement
    let angle = 0;
    const animate = () => {
        angle += 0.005;
        setSimulatedPosition({
            x: 50 + Math.cos(angle) * 30,
            y: 50 + Math.sin(angle) * 30,
        });

        // Simulate speed and mileage fluctuations
        setSimulatedSpeed(35 + Math.sin(angle * 5) * 15);
        setSimulatedMiles(prev => prev + 0.015);

        animationRef.current = requestAnimationFrame(animate);
    }
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      clearInterval(timerInterval);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const mapItems: MapItem[] = [{
      id: 'driver',
      type: 'driver',
      coords: simulatedPosition,
      status: 'busy'
  }];

  return (
    <div className="w-screen h-screen bg-slate-950 relative overflow-hidden">
      <SimulatedMapView items={mapItems} lines={[]} />

      {/* HUD */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
        <div className="max-w-4xl mx-auto bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-5">
            <div className="grid grid-cols-3 md:grid-cols-4 items-center gap-6">
                
                {/* Miles */}
                <div className="col-span-3 md:col-span-1 text-center md:text-left">
                    <p className="text-slate-400 text-sm font-medium flex items-center justify-center md:justify-start gap-2">
                        <Map className="w-4 h-4"/>
                        Tracked Miles
                    </p>
                    <p className="text-5xl font-extrabold text-white tracking-tighter">
                        {simulatedMiles.toFixed(2)}
                    </p>
                </div>

                {/* Stats */}
                <div className="hidden md:flex col-span-2 items-center justify-around border-l border-slate-700">
                    <div className="text-center">
                        <p className="text-slate-400 text-sm font-medium flex items-center gap-2">
                            <Gauge className="w-4 h-4"/>
                            Live Speed
                        </p>
                        <p className="text-3xl font-bold text-white">
                            {simulatedSpeed.toFixed(0)} <span className="text-lg text-slate-500">MPH</span>
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-slate-400 text-sm font-medium flex items-center gap-2">
                            <Timer className="w-4 h-4"/>
                            Elapsed Time
                        </p>
                        <p className="text-3xl font-bold text-white font-mono">
                            {formatTime(elapsedTime)}
                        </p>
                    </div>
                </div>

                {/* End Button */}
                <div className="col-span-3 md:col-span-1">
                    <button 
                        onClick={onEndTracking}
                        className="w-full bg-red-600 hover:bg-red-500 text-white p-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-600/20"
                    >
                        <X className="w-6 h-6"/>
                        End Tracking
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTrackingView;