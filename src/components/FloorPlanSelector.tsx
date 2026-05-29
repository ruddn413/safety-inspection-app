import React, { useMemo, useState, useEffect } from 'react';
import type { Factory, FloorPlan } from '../api';
import { Map, Building2, Factory as FactoryIcon, Layers } from 'lucide-react';

interface Props {
  factories: Factory[];
  floorPlans: FloorPlan[];
  selectedPlanId: number | null;
  onSelectPlan: (id: number) => void;
  defaultFactoryId?: number | 'all';
}

export function FloorPlanSelector({ factories, floorPlans, selectedPlanId, onSelectPlan, defaultFactoryId }: Props) {
  const defaultFac = defaultFactoryId !== 'all' && defaultFactoryId !== undefined 
    ? defaultFactoryId 
    : (factories.find(f => f.name.includes('안산'))?.id || factories[0]?.id || 1);
  
  const [selectedFactoryId, setSelectedFactoryId] = useState<number>(defaultFac);
  const [selectedBuilding, setSelectedBuilding] = useState<string | 'all'>('all');

  // Filter plans by factory
  const plansForFactory = useMemo(() => {
    return floorPlans.filter(p => p.factoryId === selectedFactoryId);
  }, [floorPlans, selectedFactoryId]);

  // Extract buildings
  const buildings = useMemo(() => {
    const bSet = new Set<string>();
    plansForFactory.forEach(p => {
      const parts = p.name.trim().split(' ');
      if (parts.length > 1 && parts[0].endsWith('동')) {
        bSet.add(parts[0]);
      } else {
        bSet.add('기타');
      }
    });
    return Array.from(bSet).sort();
  }, [plansForFactory]);

  // Reset building selection when factory changes
  useEffect(() => {
    setSelectedBuilding('all');
  }, [selectedFactoryId]);

  // Filter plans by building
  const plansForBuilding = useMemo(() => {
    if (selectedBuilding === 'all') return plansForFactory;
    return plansForFactory.filter(p => {
      const parts = p.name.trim().split(' ');
      if (parts.length > 1 && parts[0].endsWith('동')) {
        return parts[0] === selectedBuilding;
      }
      return selectedBuilding === '기타';
    });
  }, [plansForFactory, selectedBuilding]);

  // Auto-select first plan if current selection is not in the filtered list
  useEffect(() => {
    if (plansForBuilding.length > 0) {
      const isSelectedPlanValid = plansForBuilding.some(p => p.id === selectedPlanId);
      if (!isSelectedPlanValid) {
        onSelectPlan(plansForBuilding[0].id);
      }
    }
  }, [plansForBuilding, selectedPlanId, onSelectPlan]);

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 border-b border-gray-100 rounded-t-2xl">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm hover:border-blue-300 transition-colors">
          <FactoryIcon className="w-4 h-4 text-blue-500" />
          <select 
            className="bg-transparent text-sm font-bold text-gray-700 focus:outline-none cursor-pointer"
            value={selectedFactoryId}
            onChange={e => setSelectedFactoryId(Number(e.target.value))}
          >
            {factories.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm hover:border-blue-300 transition-colors">
          <Building2 className="w-4 h-4 text-indigo-500" />
          <select 
            className="bg-transparent text-sm font-bold text-gray-700 focus:outline-none min-w-[100px] cursor-pointer"
            value={selectedBuilding}
            onChange={e => setSelectedBuilding(e.target.value)}
          >
            <option value="all">전체 동</option>
            {buildings.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm hover:border-blue-300 transition-colors">
          <Map className="w-4 h-4 text-emerald-500" />
          <select 
            className="bg-transparent text-sm font-bold text-gray-700 focus:outline-none min-w-[150px] cursor-pointer"
            value={selectedPlanId || ''}
            onChange={e => onSelectPlan(Number(e.target.value))}
          >
            <option value="" disabled>도면(층) 선택...</option>
            {plansForBuilding.map(p => {
              const parts = p.name.trim().split(' ');
              const displayName = (parts.length > 1 && parts[0].endsWith('동')) 
                ? parts.slice(1).join(' ') 
                : p.name;
                
              return (
                <option key={p.id} value={p.id}>
                  {selectedBuilding === 'all' ? p.name : displayName}
                </option>
              );
            })}
          </select>
        </div>
      </div>
      
      {floorPlans.length === 0 && <div className="text-sm text-gray-400 p-2">등록된 도면이 없습니다.</div>}
    </div>
  );
}
