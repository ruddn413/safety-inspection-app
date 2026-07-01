import React, { useState, useEffect, useRef } from 'react';
import { fetchEquipment, fetchFactories, fetchFloorPlans, createFloorPlan, updateEquipmentLocation, type Equipment, type Factory, type FloorPlan } from '../api';
import { Map, Upload, Search, Image as ImageIcon, Crosshair, FileType2 } from 'lucide-react';
import { convertPdfToImage } from '../utils/pdfToImage';
import { FloorPlanSelector } from './FloorPlanSelector';
import { EquipmentMarker, EquipmentLegend } from './EquipmentMarker';
import { useAuth } from '../context/AuthContext';

export function FloorPlanAdmin() {
  const { isAdmin } = useAuth();
  const [factories, setFactories] = useState<Factory[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  // Upload Form State
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFactoryId, setUploadFactoryId] = useState<number>(0);
  const [uploadName, setUploadName] = useState('');
  const [uploadProcess, setUploadProcess] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [facs, eqs, plans] = await Promise.all([
        fetchFactories(),
        fetchEquipment(),
        fetchFloorPlans()
      ]);
      setFactories(facs);
      setEquipment(eqs);
      setFloorPlans(plans);
      
      if (plans.length > 0 && !selectedPlanId) {
        setSelectedPlanId(plans[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadFactoryId || !uploadName) return;
    setIsUploading(true);
    
    let fileToUpload = uploadFile;
    
    try {
      // If it's a PDF, convert it to an image first
      if (uploadFile.type === 'application/pdf' || uploadFile.name.toLowerCase().endsWith('.pdf')) {
        fileToUpload = await convertPdfToImage(uploadFile);
      }

      await createFloorPlan({ factoryId: uploadFactoryId, name: uploadName, processName: uploadProcess }, fileToUpload);
      await loadData();
      setShowUpload(false);
      setUploadFile(null);
      setUploadName('');
      setUploadProcess('');
    } catch (e) {
      console.error(e);
      alert('업로드 또는 PDF 변환에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, eq: Equipment) => {
    e.dataTransfer.setData('eqId', eq.id.toString());
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const eqId = e.dataTransfer.getData('eqId');
    if (!eqId || !selectedPlanId || !imgRef.current) return;

    const rect = imgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const locationX = x / rect.width;
    const locationY = y / rect.height;

    try {
      const updated = await updateEquipmentLocation(Number(eqId), { locationX, locationY, floorPlanId: selectedPlanId });
      setEquipment(prev => prev.map(eq => eq.id === updated.id ? updated : eq));
    } catch (err) {
      console.error(err);
      alert('위치 저장 실패');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removePin = async (eqId: number) => {
    if (!isAdmin) return;
    if (!confirm('설비 마커를 도면에서 제거하시겠습니까?')) return;
    try {
      const updated = await updateEquipmentLocation(eqId, { locationX: null, locationY: null, floorPlanId: null });
      setEquipment(prev => prev.map(eq => eq.id === updated.id ? updated : eq));
    } catch (err) {
      console.error(err);
    }
  };

  const selectedPlan = floorPlans.find(p => p.id === selectedPlanId);
  
  const unplacedEquipment = equipment.filter(eq => !eq.locationX && !eq.floorPlanId);
  const filteredUnplacedEquipment = unplacedEquipment.filter(eq => {
    // If no mapping process is set, show all unplaced equipment
    if (!selectedPlan?.processName) return true;
    
    // Support multiple mapping processes separated by comma
    const mappings = selectedPlan.processName.split(',').map(m => m.trim()).filter(m => m);
    if (mappings.length === 0) return true;

    // Show equipment if its categoryMain OR name OR specification matches ANY of the mapping keywords
    return mappings.some(mapping => 
      eq.categoryMain?.includes(mapping) || 
      eq.name?.includes(mapping) ||
      eq.specification?.includes(mapping)
    );
  });
  
  const placedEquipment = equipment.filter(eq => eq.floorPlanId === selectedPlanId && eq.locationX !== null && eq.locationY !== null);

  const formatCapacity = (eq: Equipment) => {
    if (!eq.capacity) return '-';
    
    // Check if the capacity already contains units (e.g. m, 대, ㎥)
    if (/[a-zA-Z가-힣㎥]/.test(eq.capacity)) {
      return eq.capacity;
    }

    if (eq.name?.includes('컨베이어')) return `${eq.capacity}m`;
    if (eq.name?.includes('로봇')) return `${eq.capacity}(대)`;
    if (eq.name?.includes('압력용기')) return `${eq.capacity}㎥`;
    if (eq.name?.includes('리프트')) return `${eq.capacity}TON`;
    
    return eq.capacity;
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">공정별 도면 관리</h2>
          <p className="text-gray-500 mt-1">새로운 도면을 업로드하고 설비 핀을 마우스로 끌어서 배치하세요.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowUpload(!showUpload)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-colors"
          >
            <Upload className="w-4 h-4" /> 도면 이미지 추가
          </button>
        )}
      </div>

      {showUpload && (
        <form onSubmit={handleUpload} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-gray-700 mb-1">공장 선택 <span className="text-red-500">*</span></label>
            <select required value={uploadFactoryId} onChange={e => setUploadFactoryId(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-4 py-2 bg-white">
              <option value={0}>공장 선택...</option>
              {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-gray-700 mb-1">도면명 <span className="text-red-500">*</span></label>
            <input required type="text" placeholder="예: 이스트 1층 작업장" value={uploadName} onChange={e => setUploadName(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2 bg-white" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-gray-700 mb-1">매핑 공정/팀명</label>
            <input type="text" placeholder="예: 이스트 (설비 자동필터용)" value={uploadProcess} onChange={e => setUploadProcess(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2 bg-white" />
          </div>
          <div className="flex-1 min-w-[250px]">
            <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
              도면 파일 (이미지 또는 PDF) <span className="text-red-500">*</span>
            </label>
            <input required type="file" accept="image/*,.pdf" onChange={e => setUploadFile(e.target.files?.[0] || null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1"><FileType2 className="w-3 h-3"/> PDF 업로드 시 1페이지가 고화질 이미지로 자동 변환됩니다.</p>
          </div>
          <button type="submit" disabled={isUploading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm whitespace-nowrap disabled:opacity-50 transition-colors">
            {isUploading ? '업로드/변환 중...' : '저장하기'}
          </button>
        </form>
      )}

      <FloorPlanSelector
        factories={factories}
        floorPlans={floorPlans}
        selectedPlanId={selectedPlanId}
        onSelectPlan={setSelectedPlanId}
      />

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* Sidebar: Unplaced Equipment */}
        <div className="w-full lg:w-72 bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col overflow-hidden max-h-[300px] lg:max-h-none shrink-0">
          <div className="p-5 border-b border-slate-100/60 bg-slate-50/50 flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-400" />
            <h3 className="font-bold text-gray-700">배치 대기 설비</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/50">
            {filteredUnplacedEquipment.length === 0 ? (
              <div className="text-center text-sm text-gray-400 py-10">
                대기 중인 설비가 없습니다.<br/>{selectedPlan?.processName ? `(공정: ${selectedPlan.processName})` : ''}
              </div>
            ) : (
              filteredUnplacedEquipment.map(eq => (
                <div 
                  key={eq.id}
                  draggable={isAdmin}
                  onDragStart={(e) => isAdmin && handleDragStart(e, eq)}
                  className={`bg-white p-3 rounded-xl border border-gray-200 shadow-sm transition-all group ${isAdmin ? 'cursor-grab active:cursor-grabbing hover:border-blue-300 hover:shadow-md' : 'opacity-80'}`}
                >
                  <div className="font-bold text-sm text-gray-800">{eq.name}</div>
                  <div className="text-xs text-gray-500 mt-1 flex justify-between">
                    <span className="truncate pr-2">
                      {eq.specification || '-'} / {formatCapacity(eq)}
                    </span>
                    <span className="text-indigo-600 font-semibold whitespace-nowrap">{eq.categoryMain}</span>
                  </div>
                  {isAdmin && (
                    <div className="mt-2 text-[10px] text-gray-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Crosshair className="w-3 h-3" /> 우측 도면으로 드래그 하세요
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main: Map Viewer */}
        <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden flex flex-col relative">
          {!selectedPlan ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <ImageIcon className="w-16 h-16 mb-4 text-gray-200" />
              <p>도면을 선택하거나 새로 업로드해주세요.</p>
            </div>
          ) : (
            <div 
              className="flex-1 overflow-hidden bg-slate-100 relative p-4 flex items-center justify-center min-h-0 min-w-0"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {/* Floor Plan Name Badge */}
              <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm border border-gray-200/50 flex items-center gap-2 pointer-events-none">
                <Map className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-gray-800">{selectedPlan.name}</span>
              </div>
              
              {/* Equipment Legend */}
              <EquipmentLegend />

              <div className="relative shadow-xl border-4 border-white rounded-xl bg-white inline-block max-w-full">
                <img 
                  ref={imgRef}
                  src={selectedPlan.imageUrl} 
                  alt="Floor Plan" 
                  className="max-w-full block"
                  style={{ maxHeight: '65vh' }}
                  draggable={false}
                />
                
                {/* Pins Overlay */}
                {placedEquipment.map(eq => (
                  <div
                    key={eq.id}
                    className="absolute group cursor-pointer hover:z-50"
                    style={{ 
                      left: `${(eq.locationX || 0) * 100}%`, 
                      top: `${(eq.locationY || 0) * 100}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                    onClick={() => removePin(eq.id)}
                  >
                    {/* Custom Icon Marker */}
                    <EquipmentMarker equipment={eq} />
                    
                    {/* Tooltip on Hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-gray-900 text-white text-xs rounded-lg py-1 px-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-10 font-medium">
                      {eq.name} <br/>
                      {isAdmin && <span className="text-blue-300 font-normal">클릭하여 핀 제거</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
