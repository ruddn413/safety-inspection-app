import React from 'react';
import { Bot, Cylinder, Package } from 'lucide-react';
import type { Equipment } from '../api';

export const ConveyorIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    {/* Box on top */}
    <rect x="7" y="4" width="10" height="7" rx="1" />
    {/* Conveyor belt loop */}
    <rect x="2" y="13" width="20" height="6" rx="3" />
    {/* Rollers */}
    <circle cx="6" cy="16" r="1" />
    <circle cx="12" cy="16" r="1" />
    <circle cx="18" cy="16" r="1" />
  </svg>
);

interface Props {
  equipment: Equipment;
  isSelected?: boolean;
}

export function EquipmentMarker({ equipment, isSelected = false }: Props) {
  const name = equipment.name || '';
  
  if (name.includes('압력용기')) {
    return (
      <div className="relative flex items-center justify-center w-7 h-7">
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-50 ${isSelected ? 'bg-amber-300 scale-150 animate-none' : 'bg-blue-300 animate-ping'}`}></span>
        <div className={`relative flex items-center justify-center w-7 h-7 bg-white rounded-full shadow-md border-2 transition-all ${isSelected ? 'border-amber-400 scale-125' : 'border-blue-200 text-blue-600'}`}>
          <Cylinder className={`w-4 h-4 ${isSelected ? 'text-amber-600' : 'text-blue-600'}`} />
        </div>
      </div>
    );
  }
  
  if (name.includes('산업용로봇')) {
    return (
      <div className="relative flex items-center justify-center w-7 h-7">
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-50 ${isSelected ? 'bg-amber-300 scale-150 animate-none' : 'bg-orange-300 animate-ping'}`}></span>
        <div className={`relative flex items-center justify-center w-7 h-7 bg-white rounded-full shadow-md border-2 transition-all ${isSelected ? 'border-amber-400 scale-125' : 'border-orange-200 text-orange-500'}`}>
          <Bot className={`w-4 h-4 ${isSelected ? 'text-amber-600' : 'text-orange-500'}`} />
        </div>
      </div>
    );
  }
  
  if (name.includes('컨베이어')) {
    return (
      <div className="relative flex items-center justify-center w-7 h-7">
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-50 ${isSelected ? 'bg-amber-300 scale-150 animate-none' : 'bg-purple-300 animate-ping'}`}></span>
        <div className={`relative flex items-center justify-center w-7 h-7 bg-white rounded-full shadow-md border-2 transition-all ${isSelected ? 'border-amber-400 scale-125' : 'border-purple-200 text-purple-600'}`}>
          <ConveyorIcon className={`w-4 h-4 ${isSelected ? 'text-amber-600' : 'text-purple-600'}`} />
        </div>
      </div>
    );
  }

  // Default Blue Circle
  return (
    <div className="relative flex h-5 w-5">
      <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${isSelected ? 'bg-amber-400 scale-150 animate-none opacity-100' : 'bg-blue-400 animate-ping'}`}></span>
      <span className={`relative inline-flex rounded-full h-5 w-5 border-2 border-white shadow-md transition-all ${isSelected ? 'bg-amber-500 scale-125 ring-2 ring-amber-200' : 'bg-blue-600'}`}></span>
    </div>
  );
}

export function EquipmentLegend() {
  return (
    <div className="absolute top-16 left-4 z-20 bg-white/95 backdrop-blur-sm px-3 py-2.5 rounded-xl shadow-md border border-gray-200/60 pointer-events-none flex flex-col gap-2">
      <div className="text-xs font-extrabold text-gray-800 border-b border-gray-200/80 pb-1.5 mb-0.5">설비 범례</div>
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-5 h-5 bg-white rounded-full shadow-sm border border-blue-200">
          <Cylinder className="w-3 h-3 text-blue-600" />
        </div>
        <span className="text-xs font-semibold text-gray-600">압력용기</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-5 h-5 bg-white rounded-full shadow-sm border border-orange-200">
          <Bot className="w-3 h-3 text-orange-500" />
        </div>
        <span className="text-xs font-semibold text-gray-600">산업용로봇</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-5 h-5 bg-white rounded-full shadow-sm border border-purple-200">
          <ConveyorIcon className="w-3 h-3 text-purple-600" />
        </div>
        <span className="text-xs font-semibold text-gray-600">컨베이어</span>
      </div>
    </div>
  );
}
