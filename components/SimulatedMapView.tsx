import React from 'react';
import { MapPin, ShoppingBag, Navigation } from 'lucide-react';

// --- TYPE DEFINITIONS ---
export interface MapItem {
  id: string;
  type: 'pickup' | 'delivery' | 'driver' | 'pending_order';
  coords: { x: number; y: number };
  status?: 'idle' | 'busy' | 'offline' | 'pending_approval';
  isHovered?: boolean;
}

export interface MapLine {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  style: 'dashed' | 'solid' | 'pulse';
  color?: string;
}

interface SimulatedMapViewProps {
  items: MapItem[];
  lines: MapLine[];
}


// --- SUB-COMPONENTS ---

// Memoized component for the city grid background to prevent re-renders
const CityGrid = React.memo(() => (
  <svg width="100%" height="100%" className="absolute inset-0">
    <defs>
      <pattern id="grid-sm" width="16" height="16" patternUnits="userSpaceOnUse">
        <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#33415544" strokeWidth="0.5"/>
      </pattern>
      <pattern id="grid-lg" width="80" height="80" patternUnits="userSpaceOnUse">
        <rect width="80" height="80" fill="url(#grid-sm)"/>
        <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#47556988" strokeWidth="1"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid-lg)" />
  </svg>
));


// --- MAIN COMPONENT ---

const SimulatedMapView: React.FC<SimulatedMapViewProps> = ({ items, lines }) => {
  
  const renderItem = (item: MapItem) => {
    const style = { left: `${item.coords.x}%`, top: `${item.coords.y}%` };
    const baseClasses = 'absolute -ml-4 -mt-4 flex items-center justify-center rounded-full border-2 transition-all duration-300 shadow-lg';

    switch (item.type) {
      case 'pickup':
        return (
          <div key={item.id} style={style} className={`${baseClasses} w-8 h-8 z-20 ${
            item.isHovered ? 'scale-110 bg-indigo-500 border-white text-white' : 'bg-slate-800 border-slate-600 text-slate-400'
          }`}>
            <ShoppingBag className="w-4 h-4" />
          </div>
        );
      case 'delivery':
        return (
          <div key={item.id} style={style} className={`${baseClasses} w-8 h-8 z-20 ${
            item.isHovered ? 'scale-110 bg-green-500 border-white text-white' : 'bg-slate-800 border-slate-600 text-slate-400'
          }`}>
            <MapPin className="w-4 h-4" />
          </div>
        );
      case 'driver':
        return (
            <div key={item.id} style={style} className={`${baseClasses} w-8 h-8 z-30 border-white ${
                item.status === 'busy' ? 'bg-red-500' : item.status === 'idle' ? 'bg-green-500' : 'bg-slate-600'
            }`}>
                <Navigation className={`w-4 h-4 text-white ${item.status === 'busy' ? 'animate-pulse' : ''}`} />
            </div>
        );
      case 'pending_order':
         return (
            <div key={item.id} style={style} className="absolute w-6 h-6 -ml-3 -mt-3 flex items-center justify-center z-10">
                <div className="w-3 h-3 rotate-45 transform bg-orange-500 animate-bounce border border-white shadow-lg" />
            </div>
         );
      default:
        return null;
    }
  };

  const renderLine = (line: MapLine) => {
      const strokeDasharray = line.style === 'dashed' ? '4 4' : 'none';
      const strokeColor = line.color || (line.style === 'pulse' ? '#818cf8' : '#64748b');
      const strokeWidth = (line.style === 'solid' || line.style === 'pulse') ? 2.5 : 2;

      return (
        <line
            key={line.id}
            x1={`${line.from.x}%`} y1={`${line.from.y}%`}
            x2={`${line.to.x}%`} y2={`${line.to.y}%`}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            className={`transition-all duration-300 opacity-70 ${line.style === 'pulse' ? 'animate-pulse' : ''}`}
        />
      );
  }

  return (
    <div className="absolute inset-0 bg-slate-950 overflow-hidden">
      <CityGrid />
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
        {lines.map(renderLine)}
      </svg>
      {items.map(renderItem)}
    </div>
  );
};

export default SimulatedMapView;