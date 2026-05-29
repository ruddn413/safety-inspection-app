import React, { useEffect, useState } from 'react';
import { differenceInDays, isBefore, startOfToday, parseISO } from 'date-fns';
import { FloorPlanSelector } from './FloorPlanSelector';
import { EquipmentMarker, EquipmentLegend, ConveyorIcon } from './EquipmentMarker';
import { fetchDashboardSummary, fetchFactories, type DashboardSummary } from '../api';

export function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [factoryCount, setFactoryCount] = useState<number>(0);

  useEffect(() => {
    async function loadData() {
      try {
        const [sumData, facts] = await Promise.all([
          fetchDashboardSummary(),
          fetchFactories()
        ]);
        setSummary(sumData);
        setFactoryCount(facts.length);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      }
    }
    loadData();
  }, []);
    <circle cx="12" cy="16" r="1" />
    <circle cx="18" cy="16" r="1" />
  </svg>
);

export function Dashboard() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFactoryId, setSelectedFactoryId] = useState<number | 'all'>('all');
  
  // Modal states
  const [modalType, setModalType] = useState<'completedThisYear' | 'scheduledNextYear' | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(null);
  const selectedEqRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedEquipmentId && selectedEqRef.current) {
      // Small timeout ensures the accordion animation completes and layout settles before scrolling
      setTimeout(() => {
        selectedEqRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
  }, [selectedEquipmentId, expandedCategory]);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [eq, facts, plans] = await Promise.all([
          fetchEquipment(),
          fetchFactories(),

// MISSING LINE 62
// MISSING LINE 63
// MISSING LINE 64
// MISSING LINE 65
// MISSING LINE 66
// MISSING LINE 67
// MISSING LINE 68
// MISSING LINE 69
// MISSING LINE 70
// MISSING LINE 71
// MISSING LINE 72
// MISSING LINE 73
// MISSING LINE 74
// MISSING LINE 75
// MISSING LINE 76
// MISSING LINE 77
// MISSING LINE 78
// MISSING LINE 79
// MISSING LINE 80
// MISSING LINE 81
// MISSING LINE 82
// MISSING LINE 83
// MISSING LINE 84
// MISSING LINE 85
// MISSING LINE 86
// MISSING LINE 87
// MISSING LINE 88
// MISSING LINE 89
// MISSING LINE 90
// MISSING LINE 91
// MISSING LINE 92
// MISSING LINE 93
// MISSING LINE 94
// MISSING LINE 95
// MISSING LINE 96
// MISSING LINE 97
// MISSING LINE 98
// MISSING LINE 99
          <button 
            onClick={() => setSelectedFactoryId('all')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors shadow-sm border ${
              selectedFactoryId === 'all' 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            전체 공장
          </button>
    const key = eq.categoryMain || '미분류';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(categoryMainStats)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const nameStats = filteredEq.reduce((acc, eq) => {
    const key = eq.name || '미분류';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const barData = Object.entries(nameStats)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const modalEquipment = modalType === 'completedThisYear' 
    ? filteredEq.filter(eq => eq.lastInspectionDate && parseISO(eq.lastInspectionDate as string).getFullYear() === currentYear)
    : modalType === 'scheduledNextYear'
      ? filteredEq.filter(eq => eq.nextInspectionDate && parseISO(eq.nextInspectionDate as string).getFullYear() === currentYear + 1)
      : [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">안전검사 통합 대시보드</h2>
          <p className="text-sm text-gray-500 mt-1">사업장 내 전체 위험기계기구 검사 및 자산 현황을 한눈에 파악하세요.</p>
        </div>
                selectedFactoryId === f.id 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 bg-blue-50 w-24 h-24 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <Package className="w-8 h-8 text-blue-200 absolute bottom-4 left-4" />
          </div>
          <p className="text-sm font-semibold text-gray-500 mb-1 relative z-10">총 등록 설비</p>
          <div className="flex items-baseline gap-2 relative z-10">
            <h3 className="text-4xl font-bold text-gray-900">{totalEq}</h3>
            <span className="text-sm font-medium text-gray-500">대</span>
          </div>
        </div>

        {/* Completed This Year */}
        <div 
          onClick={() => setModalType('completedThisYear')}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 transitio
            내년 검사 대상 ({currentYear + 1}년) <ArrowRight className="w-3 h-3" />
          </p>
          <div className="flex items-baseline gap-2 relative z-10">
            <h3 className="text-4xl font-bold text-indigo-600">{scheduledNextYearCount}</h3>
            <span className="text-sm font-medium text-gray-500">대</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: D-Day List */}
        </div>

        {/* Scheduled Next Year */}
        <div 
          onClick={() => setModalType('scheduledNextYear')}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className="absolute -right-6 -top-6 bg-indigo-50 w-24 h-24 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <CalendarClock className="w-8 h-8 text-indigo-300 absolute bottom-4 left-4" />
          </div>
          <p className="text-sm font-semibold text-indigo-600 mb-1 relative z-10 flex items-center gap-1 group-hover:underline">
            내년 검사 대상 ({currentYear + 1}년) <ArrowRight className="w-3 h-3" />
          </p>
          <div className="flex items-baseline gap-2 relative z-10">
            <h3 className="text-4xl font-bold text-indigo-600">{scheduledNextYearCount}</h3>
            <span className="text-sm font-medium text-gray-500">대</span>
          </div>
        </div>
      </div>

      {/* Floor Plan Viewer */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Map className="w-5 h-5 text-gray-500" /> 공정별 도면 뷰어
        </h3>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
          {floorPlans.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-slate-50">
              <ImageIcon className="w-16 h-16 mb-4 text-gray-200" />
              <p className="text-lg font-semibold text-gray-600 mb-2">등록된 공정 도면이 없습니다.</p>
              <p className="text-sm">좌측 메뉴의 <strong>[공정별 도면 관리]</strong> 탭에서 먼저 도면을 업로드해주세요.</p>
            </div>
          ) : (
            <>
              <FloorPlanSelector
                factories={factories}
                floorPlans={floorPlans}
                selectedPlanId={selectedPlanId}
                onSelectPlan={setSelectedPlanId}
                defaultFactoryId={selectedFactoryId}
              />
        </div>

        {/* Right Col: Charts */}
        <div className="lg:col-span-2 flex flex-col gap-6 h-[500px]">
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 mb-4">공정(팀)별 설비 보유 현황</h3>
            <div className="flex-1 w-full h-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#1f2937', fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bar Chart Row */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 h-[400px] flex flex-col">
        <h3 className="text-lg font-bold text-gray-800 mb-4">설비 종류별 현황</h3>
        <div className="flex-1 w-full h-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
              <RechartsTooltip 
                cursor={{ fill: '#f9fafb' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="count" name="설비 수" radius={[6, 6, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Equipment List Modal */}
      {modalType && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
// MISSING LINE 296
// MISSING LINE 297
// MISSING LINE 298
// MISSING LINE 299
          {barData.map((item, idx) => {
            const colors = [
              { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-500', border: 'border-blue-100', hover: 'hover:border-blue-300 hover:shadow-blue-100' },
              { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-500', border: 'border-purple-100', hover: 'hover:border-purple-300 hover:shadow-purple-100' },
              { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-500', border: 'border-amber-100', hover: 'hover:border-amber-300 hover:shadow-amber-100' },
              { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-500', border: 'border-emerald-100', hover: 'hover:border-emerald-300 hover:shadow-emerald-100' },
              { bg: 'bg-rose-50', text: 'text-rose-700', icon: 'text-rose-500', border: 'border-rose-100', hover: 'hover:border-rose-300 hover:shadow-rose-100' },
            ];
            const colorTheme = colors[idx % colors.length];
            
            const getIcon = () => {
              if (item.name.includes('컨베이어')) return <ConveyorIcon className={`w-7 h-7 ${colorTheme.icon}`} />;
              if (item.name.includes('로봇')) return <Bot className={`w-7 h-7 ${colorTheme.icon}`} />;
              if (item.name.includes('압력용기')) return <Cylinder className={`w-7 h-7 ${colorTheme.icon}`} />;
              return <Settings className={`w-7 h-7 ${colorTheme.icon}`} />;
            };

      
                <div className="relative z-10 flex flex-col h-full">
    
// MISSING LINE 320
// MISSING LINE 321
// MISSING LINE 322
// MISSING LINE 323
// MISSING LINE 324
// MISSING LINE 325
// MISSING LINE 326
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Equipment List Modal */}
      {modalType && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">

      {/* Floor Plan Viewer */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Map className="w-5 h-5 text-gray-500" /> 공정별 도면 뷰어
        </h3>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
          {floorPlans.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-slate-50">
              <ImageIcon className="w-16 h-16 mb-4 text-gray-200" />
        </div>
      </div>

      {/* Floor Plan Viewer */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Map className="w-5 h-5 text-gray-500" /> 공정별 도면 뷰어
        </h3>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
          {floorPlans.length === 0 ? (
                  {(() => {
                    const selectedPlan = floorPlans.find(p => p.id === selectedPlanId);
                    const placedEquipment = equipment.filter(eq => eq.floorPlanId === selectedPlanId && eq.locationX !== null && eq.locationY !== null);
                    
                    if (!selectedPlan) return null;
                    return (
                      <>
                        {/* Floor Plan Name Badge */}
                        <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm border border-gray-200/50 flex items-center gap-2 pointer-events-none">
                          <Map className="w-4 h-4 text-blue-600" />
                          <span className="font-bold text-gray-800">{selectedPlan.name}</span>
                        </div>

                        <div className="relative shadow-xl border-4 border-white rounded-xl bg-white inline-block max-w-full">
                          <img 
                            src={`http://localhost:3000${selectedPlan.imageUrl}`} 
                            alt="Floor Plan" 
                            className="max-w-full block"
                            style={{ maxHeight: '480px' }}
                            draggable={false}
                          />
                        
                        {placedEquipment.map(eq => (
                          <div
                            key={eq.id}
                            onClick={() => {
                              setExpandedCategory(eq.name);
                              setSelectedEquipmentId(eq.id);
                            }}
                            className={`absolute group cursor-pointer ${selectedEquipmentId === eq.id ? 'z-50' : 'hover:z-50'}`}
                            style={{ 
                              left: `${(eq.locationX || 0) * 100}%`, 
                              top: `${(eq.locationY || 0) * 100}%`,
                              transform: 'translate(-50%, -50%)'
                            }}
                          >
                            <EquipmentMarker equipment={eq} isSelected={selectedEquipmentId === eq.id} />
                            
                            {/* Interactive Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-white text-gray-800 rounded-xl p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl border border-gray-100 z-10 flex flex-col gap-2">
                                <span className="font-semibold text-blue-600">{eq.recentPassNum || '-'}</span>
                              </div>
                              {eq.attachmentUrl && (
                                <div className="mt-1 h-24 w-full rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                  <img src={`http://localhost:3000${eq.attachmentUrl}`} alt={eq.name} className="w-full h-full object-cover" />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      </>
                    );
                  })()}
                </div>

                {/* Right: Info Panel */}
                <div className="w-96 bg-white border-l border-gray-100 p-5 flex flex-col gap-4 overflow-y-auto z-10 shadow-[-4px_0_15px_-5px_rgba(0,0,0,0.05)]">
                  {(() => {
                    const selectedPlan = floorPlans.find(p => p.id === selectedPlanId);
                    const placedEquipment = equipment.filter(eq => eq.floorPlanId === selectedPlanId && eq.locationX !== null && eq.locationY !== null);
                    if (!selectedPlan) return null;
                    
                    const totalEq = placedEquipment.length;
                    const categories = placedEquipment.reduce((acc, 
                  const isUrgent = eq.dDay <= 30;
                  return (
                    <li key={eq.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group cursor-default">
                      <div className="flex flex-col min-w-0">
                        <span
                    const categories = placedEquipment.reduce((acc, eq) => {
                      const name = eq.name || '알 수 없음';
                      acc[name] = (acc[name] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>);

                    return (
                      <>
                        <h4 className="font-bold text-gray-800 text-base border-b pb-3 flex items-center justify-between">
                          도면 요약 정보
                          <span className="text-xs font-normal text-gray-400">자세히 보려면 목록을 클릭하세요</span>
                        </h4>
                        <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 shadow-sm relative overflow-hidden shrink-0">
                          <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-100 rounded-full opacity-50"></div>
                          <div className="text-sm font-semibold text-blue-800 mb-1 relative z-10">배치된 설비 총계</div>
                          <div className="text-3xl font-extrabold text-blue-600 relative z-10">{totalEq}<span className="text-base font-medium ml-1">대</span></div>
                        </div>
                        
                        {totalEq > 0 && (
                          <div className="flex flex-col gap-2 mt-2">
                            <div className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">설비 종류별 상세 현황</div>
                            <div className="space-y-3">
                              {Object.entries(categories).map(([cat, count]) => (
                                <div key={cat} className="flex flex-col gap-1">
                                  <button 
                                    onClick={() => setExpandedCategory(expandedCategory === cat ? null : cat)}
                                    className={`w-full flex justify-between items-center text-sm p-3 rounded-xl border transition-all text-left ${
                                      expandedCategory === cat
                                        ? 'bg-blue-50 border-blue-300 shadow-md ring-2 ring-blue-100'
                                        : 'bg-gray-50 border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200'
                                    }`}
                                  >
                                    <span className={`font-bold ${expandedCategory === cat ? 'text-blue-800' : 'text-gray-700'}`}>{cat}</span>
                                    <div className="flex items-center gap-2">
                                      <span className={`font-extrabold px-2 py-0.5 rounded-lg ${
                                        expandedCategory === cat ? 'text-white bg-blue-600' : 'text-indigo-600 bg-indigo-50'
                     
                        )}
                        
                        <div className="mt-auto pt-4 text-xs text-gray-400 bg-gray-50 p-4 rounded-xl border border-gray-100 leading-relaxed">
                          <Map className="w-5 h-5 mb-2 text-gray-300" />
                          도면 위의 파란색 마커에 마우스를 올리면 해당 설비의 <strong>합격번호</strong> 및 <strong>첨부 사진</strong>을 확인할 수 있습니다.
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </>
          )}
                                          <div className={`font-bold flex justify-between ${selectedEquipmentId === eq.id ? 'text-blue-900' : 'text-gray-800'}`}>
                                            <span>{eq.name}</span>
                                            <span className="text-blue-600">{eq.recentPassNum || '합격번호 없음'}</span>
                                          </div>
                                          {eq.specification && (
                                            <div className="text-gray-600 flex gap-2">
                                              <span className="font-semibold text-gray-500 w-16">형식/규격:</span>
                                              <span className="truncate">{eq.specification}</span>
                                            </div>
                                          )}
                                          {eq.capacity && (
                                            <div className="text-gray-600 flex gap-2">
                                              <span className="font-semibold text-gray-500 w-16">용량/등급:</span>
                                              <span className="truncate">
                                                {eq.capacity}
                                                {eq.name.includes('컨베이어') ? 'm' : 
                                                 eq.name.includes('로봇') ? ' (대)' : 
                                                 eq.name.includes('압력용기') ? '㎥' : ''}
                                              </span>
                                            </div>
                                          )}
                                              <span className="truncate">{eq.capacity}</span>
                                            </div>
                                          )}
                                          {eq.lastInspectionDate && (
                                            <div className="text-gray-500 mt-1.5 pt-1.5 border-t border-gray-50 flex items-center gap-1">
                                              <ShieldCheck className="w-3.5 h-3.5 text-green-500"/> 
                                              최근 검사일: {eq.lastInspectionDate}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                <div className="relative z-10 flex flex-col h-full">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-sm bg-white border ${colorTheme.border} group-hover:scale-110 transition-transform duration-300`}>
                    {getIcon()}
                  </div>
                  <div className="mt-auto">
                    <h4 className="text-sm font-semibold text-gray-500 mb-1">{item.name}</h4>
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-3xl font-bold ${colorTheme.text}`}>{item.count}</span>
                      <span className="text-sm font-medium text-gray-400">대</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Equipment List Modal */}
      {modalType && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                {modalType === 'completedThisYear' ? (
                  <><ShieldCheck className="w-5 h-5 text-emerald-500" /> 올해 검사 완료 ({currentYear}년)</>
                ) : (
// MISSING LINE 541
// MISSING LINE 542
// MISSING LINE 543
// MISSING LINE 544
// MISSING LINE 545
// MISSING LINE 546
// MISSING LINE 547
// MISSING LINE 548
// MISSING LINE 549
// MISSING LINE 550
// MISSING LINE 551
// MISSING LINE 552
// MISSING LINE 553
// MISSING LINE 554
// MISSING LINE 555
// MISSING LINE 556
// MISSING LINE 557
// MISSING LINE 558
// MISSING LINE 559
// MISSING LINE 560
// MISSING LINE 561
                        </span>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded font-medium">{eq.categoryMain || '미분류'}</span>
                          <span>|</span>
                          <span className="truncate">
                            {modalType === 'completedThisYear' ? '완료일:' : '예정일:'} 
                            <span className="text-gray-900 font-medium ml-1">
                              {modalType === 'completedThisYear' ? eq.lastInspectionDate?.split('T')[0] : eq.nextInspectionDate?.split('T')[0]}
                            </span>
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        기기번호: {eq.manufacturingNum || '-'}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 text-right">
              <button 
                onClick={() => setModalType(null)}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// MISSING LINE 598
// MISSING LINE 599
// MISSING LINE 600
// MISSING LINE 601
// MISSING LINE 602
// MISSING LINE 603
     │
 251 │               <thead className="bg-gray-50">
     │                ──┬──  
     │                  ╰──── Opened here
     │ 
 321 │             </table>
     │               ──┬──  
     │                 ╰──── Expected `</thead>`
─────╯

[PARSE_ERROR] Expected corresponding JSX closing tag for 'table'.
     ╭─[ src/components/FactoryList.tsx:322:13 ]
     │
 250 │             <table className="min-w-full divide-y divide-gray-200">
     │              ──┬──  
     │                ╰──── Opened here
     │ 
 322 │           </div>
     │             ─┬─  
     │              ╰─── Expected `</table>`
─────╯

[PARSE_ERROR] Unexpected token. Did you mean `{'}'}` or `&rbrace;`?
     ╭─[ src/components/FactoryList.tsx:527:1 ]
     │
 527 │ }
     │ │ 
     │ ╰─ 
─────╯

  Plugin: vite:oxc
  File: C:/Users/82106/safety-inspection-app/src/components/FactoryList.tsx
      at transformWithOxc (file:///C:/Users/82106/safety-inspection-app/node_modules/vite/dist/node/chunks/node.js:3338:19)
      at TransformPluginContext.transform (file:///C:/Users/82106/safety-inspection-app/node_modules/vite/dist/node/chunks/node.js:3409:26)
      at EnvironmentPluginContainer.transform (file:///C:/Users/82106/safety-inspection-app/node_modules/vite/dist/node/chunks/node.js:30273:51)
      at async loadAndTransform (file:///C:/Users/82106/safety-inspection-app/node_modules/vite/dist/node/chunks/node.js:24532:26)
      at async viteTransformMiddleware (file:///C:/Users/82106/safety-inspection-app/node_modules/vite/dist/node/chunks/node.js:24326:20)
