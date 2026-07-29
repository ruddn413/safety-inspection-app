import React, { useEffect, useState, useMemo, useRef } from 'react';
import { differenceInDays, isBefore, startOfToday, parseISO } from 'date-fns';
import { FloorPlanSelector } from './FloorPlanSelector';
import { EquipmentMarker, EquipmentLegend, ConveyorIcon, LiftIcon } from './EquipmentMarker';
import { fetchDashboardSummary, fetchFactories, fetchFloorPlans, fetchEquipment, fetchLaws, type DashboardSummary, type Factory, type FloorPlan, type Equipment, type LawUpdate } from '../api';
import { ShieldCheck, AlertTriangle, AlertCircle, Settings, Map as MapIcon, Image as ImageIcon, CheckCircle, CalendarClock, Bot, Cylinder, X, ArrowRight, Activity, Package, Download, FileSpreadsheet, ExternalLink } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [laws, setLaws] = useState<LawUpdate[]>([]);
  const [factoryCount, setFactoryCount] = useState<number>(0);
  
  const [selectedFactoryId, setSelectedFactoryId] = useState<number | 'all'>('all');
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(null);
  const [hoveredEqId, setHoveredEqId] = useState<number | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  
  const [modalType, setModalType] = useState<'completedThisYear' | 'scheduledNextYear' | null>(null);
  const [modalEquipment, setModalEquipment] = useState<Equipment[]>([]);
  const selectedEqRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      // 1. Fetch Korean Font (NanumGothic from local public folder)
      const fontRes = await fetch('/NanumGothic.ttf');
      if (!fontRes.ok) throw new Error("Failed to load font");
      
      const blob = await fontRes.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      await new Promise(resolve => reader.onload = resolve);
      const base64 = (reader.result as string).split(',')[1];
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      
      pdf.addFileToVFS('NanumGothic.ttf', base64);
      pdf.addFont('NanumGothic.ttf', 'NanumGothic', 'normal');
      pdf.setFont('NanumGothic');
      
      const dateStr = new Date().toISOString().split('T')[0];
      
      // Header
      pdf.setFontSize(22);
      pdf.setTextColor(30);
      pdf.text("C'HES 안전검사 통합관리 현황 리포트", 14, 20);
      
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text(`출력일자: ${dateStr}`, 14, 28);
      
      // Summary Box
      pdf.setFontSize(12);
      pdf.setTextColor(0);
      pdf.text(`총 등록 설비: ${totalEquipmentCount}대`, 14, 40);
      pdf.text(`올해 정기검사 대상: ${completedThisYearCount}대`, 70, 40);
      pdf.text(`내년 정기검사 대상: ${scheduledNextYearCount}대`, 140, 40);
      
      // Table Data
      const tableData = equipment.map(eq => {
        let capacity = eq.capacity || '-';
        if (capacity !== '-' && !/[a-zA-Z가-힣㎥³]/.test(capacity)) {
          if (eq.name?.includes('컨베이어')) capacity = `${capacity}m`;
          else if (eq.name?.includes('로봇')) capacity = `${capacity}(대)`;
          else if (eq.name?.includes('압력용기')) capacity = `${capacity}m³`;
          else if (eq.name?.includes('리프트')) capacity = `${capacity}TON`;
        }
        
        return [
          eq.factory?.name || '-',
          eq.name || '-',
          eq.specification || '-',
          eq.manufacturingNum || '-',
          capacity,
          eq.recentPassNum || '-',
          `${eq.lastInspectionDate ? new Date(eq.lastInspectionDate).toLocaleDateString() : '-'} ~ ${eq.nextInspectionDate ? new Date(eq.nextInspectionDate).toLocaleDateString() : '-'}`
        ];
      });
      
      autoTable(pdf, {
        startY: 48,
        head: [['공장', '유해·위험기계명', '형식(규격)', '기기번호', '용량', '합격번호', '검사유효기간']],
        body: tableData,
        styles: { font: 'NanumGothic', fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'normal' },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        margin: { top: 14, left: 14, right: 14 },
      });
      
      pdf.save(`안전검사_대시보드_리포트_${dateStr}.pdf`);
    } catch (error: any) {
      console.error('PDF 다운로드 실패:', error);
      alert('PDF 생성 중 오류가 발생했습니다.\n상세 내용: ' + (error?.message || error));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadExcel = () => {
    const workbook = XLSX.utils.book_new();
    const aoa: any[][] = [];

    // 1. Group data by equipment name
    const eqGroups = new Map<string, Equipment[]>();
    equipment.forEach(eq => {
      const eqName = eq.name || '미분류';
      if (!eqGroups.has(eqName)) eqGroups.set(eqName, []);
      eqGroups.get(eqName)!.push(eq);
    });

    // 2. Summary Section
    aoa.push(['[설비 종류별 대수 요약]']);
    aoa.push(['유해·위험기계명', '보유 대수']);
    let total = 0;
    const sortedNames = Array.from(eqGroups.keys()).sort();
    sortedNames.forEach(name => {
      const list = eqGroups.get(name)!;
      aoa.push([name, `${list.length}대`]);
      total += list.length;
    });
    aoa.push(['총합계', `${total}대`]);
    aoa.push([]); // blank row
    aoa.push([]); // blank row

    // 3. Header Section
    aoa.push(['[설비 종류별 상세 현황]']);
    aoa.push(['공장명', '유해·위험기계명', '형식(규격)', '기기번호', '용량', '최근 검사일', '차기 검사일', '합격번호', '비고']);

    // 4. Detailed Data Rows (grouped by equipment name)
    sortedNames.forEach(name => {
      const list = eqGroups.get(name)!;
      list.forEach(eq => {
        let capacity = eq.capacity || '-';
        if (capacity !== '-' && !/[a-zA-Z가-힣㎥³]/.test(capacity)) {
          if (eq.name?.includes('컨베이어')) capacity = `${capacity}m`;
          else if (eq.name?.includes('로봇')) capacity = `${capacity}(대)`;
          else if (eq.name?.includes('압력용기')) capacity = `${capacity}m³`;
          else if (eq.name?.includes('리프트')) capacity = `${capacity}TON`;
        }
        
        aoa.push([
          eq.factory?.name || '-',
          eq.name || '-',
          eq.specification || '-',
          eq.manufacturingNum || '-',
          capacity,
          eq.lastInspectionDate ? new Date(eq.lastInspectionDate).toLocaleDateString() : '-',
          eq.nextInspectionDate ? new Date(eq.nextInspectionDate).toLocaleDateString() : '-',
          eq.recentPassNum || '-',
          eq.categoryDetail || '-'
        ]);
      });
    });

    const worksheet = XLSX.utils.aoa_to_sheet(aoa);

    // Merge cells for the title headers to make it look nicer
    if (!worksheet['!merges']) worksheet['!merges'] = [];
    worksheet['!merges'].push(
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }, // [설비 종류별 대수 요약]
      { s: { r: aoa.length - total - 3, c: 0 }, e: { r: aoa.length - total - 3, c: 2 } } // [상세 현황] title
    );

    const wscols = [
      { wch: 15 }, // 공장명
      { wch: 25 }, // 기계명
      { wch: 25 }, // 규격
      { wch: 20 }, // 기기번호
      { wch: 15 }, // 용량
      { wch: 15 }, // 최근
      { wch: 15 }, // 차기
      { wch: 15 }, // 합격번호
      { wch: 25 }  // 비고
    ];
    worksheet['!cols'] = wscols;

    XLSX.utils.book_append_sheet(workbook, worksheet, "통합 설비현황");
    
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `안전검사_통합현황_${dateStr}.xlsx`);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [sumRes, facts, plans, eqData] = await Promise.all([
          fetchDashboardSummary(),
          fetchFactories(),
          fetchFloorPlans(),
          fetchEquipment()
        ]);
        setSummary(sumRes);
        setFactories(facts);
        setFactoryCount(facts.length);
        setFloorPlans(plans);
        setEquipment(eqData);
        
        // Auto select first factory and plan
        const firstFactoryId = facts.length > 0 ? facts[0].id : 'all';
        setSelectedFactoryId(firstFactoryId);
        
        const firstPlan = plans.find(p => p.factoryId === firstFactoryId) || plans[0];
        if (firstPlan) {
          setSelectedPlanId(firstPlan.id);
        }
      } catch (err) {
        console.error("Failed to load core dashboard data", err);
      }
    }

    async function loadLaws() {
      try {
        const lawsRes = await fetchLaws();
        setLaws(lawsRes);
      } catch (err) {
        console.error("Failed to load laws", err);
      }
    }

    loadData();
    loadLaws();
  }, []);

  useEffect(() => {
    if (selectedEquipmentId && selectedEqRef.current) {
      selectedEqRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedEquipmentId]);

  useEffect(() => {
    if (modalType) {
      const currentYear = new Date().getFullYear();
      let filtered: Equipment[] = [];
      
      if (modalType === 'completedThisYear') {
        filtered = equipment.filter(eq => {
          if (!eq.lastInspectionDate || typeof eq.lastInspectionDate !== 'string') return false;
          return parseInt(String(eq.lastInspectionDate).split('-')[0], 10) === currentYear;
        });
      } else if (modalType === 'scheduledNextYear') {
        filtered = equipment.filter(eq => {
          if (!eq.nextInspectionDate || typeof eq.nextInspectionDate !== 'string') return false;
          return parseInt(String(eq.nextInspectionDate).split('-')[0], 10) === currentYear + 1;
        });
      }
      setModalEquipment(filtered);
    }
  }, [modalType, equipment]);

  const today = startOfToday();
  const upcomingList = useMemo(() => {
    return equipment
      .filter(eq => eq.nextInspectionDate && typeof eq.nextInspectionDate === 'string' && eq.nextInspectionDate.trim() !== '')
      .map(eq => {
        try {
          const dDay = differenceInDays(parseISO(eq.nextInspectionDate!), today);
          return { ...eq, dDay };
        } catch (e) {
          return { ...eq, dDay: 9999 };
        }
      })
      .filter(eq => eq.dDay >= 0 && eq.dDay <= 60)
      .sort((a, b) => a.dDay - b.dDay)
      .slice(0, 8);
  }, [equipment, today]);

  const pieData = useMemo(() => {
    const processMap = new Map<string, number>();
    equipment.forEach(eq => {
      let p = eq.categoryMain && eq.categoryMain.trim() !== '' ? eq.categoryMain.trim() : '미지정 공정';
      if (p === '미지정 공정' && eq.floorPlanId) {
        const plan = floorPlans.find(plan => plan.id === eq.floorPlanId);
        if (plan && plan.processName && plan.processName.trim() !== '') {
          p = plan.processName.trim();
        }
      }
      if (p === '기타') {
        const factory = factories.find(f => f.id === eq.factoryId);
        if (factory) {
          p = `[${factory.name}] 기타`;
        }
      }
      processMap.set(p, (processMap.get(p) || 0) + 1);
    });
    return Array.from(processMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [equipment, floorPlans, factories]);

  const barData = useMemo(() => {
    const categoryMap = new Map<string, number>();
    equipment.forEach(eq => {
      const cat = eq.name || '알 수 없음';
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    });
    return Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [equipment]);

  const currentYear = new Date().getFullYear();
  const completedThisYearCount = equipment.filter(eq => eq.lastInspectionDate && typeof eq.lastInspectionDate === 'string' && parseInt(String(eq.lastInspectionDate).split('-')[0], 10) === currentYear).length;
  const scheduledNextYearCount = equipment.filter(eq => eq.nextInspectionDate && typeof eq.nextInspectionDate === 'string' && parseInt(String(eq.nextInspectionDate).split('-')[0], 10) === currentYear + 1).length;
  const totalEquipmentCount = equipment.length;

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6" ref={dashboardRef}>
      {/* C'HES Banner Header */}
      <div className="bg-gradient-to-r from-[#133e60] via-[#1b5683] to-[#2573b1] text-white p-6 md:p-8 rounded-2xl shadow-md mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        {/* Subtle circular overlays for C'HES wave effect */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-[30%] w-[800px] h-[800px] border-[60px] border-white/[0.03] rounded-full pointer-events-none"></div>
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-[15%] w-[500px] h-[500px] border-[40px] border-white/[0.04] rounded-full pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="text-blue-100 text-xs font-bold tracking-wider mb-1">C'HES SAFETY MANAGEMENT</div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">안전검사 통합관리</h1>
          <p className="text-blue-50 text-sm">법정 안전검사 대상 설비의 실시간 현황 및 도면 배치를 한 곳에서 관리합니다.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 relative z-10">
          <button 
            onClick={handleDownloadExcel}
            className="flex items-center gap-1.5 bg-transparent border border-white/30 text-white px-4 py-2 rounded font-medium text-sm hover:bg-white/10 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            엑셀 다운로드
          </button>
          <button 
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {isDownloading ? 'PDF 생성 중...' : '리포트 다운로드'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Total */}
        <div className="bg-white rounded-3xl p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-blue-200/50 hover:-translate-y-1 transition-all cursor-default relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 bg-blue-50 w-28 h-28 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-100/50 transition-all duration-500">
            <Settings className="w-10 h-10 text-blue-400 absolute bottom-5 left-5" />
          </div>
          <p className="text-sm font-semibold text-blue-600 mb-2 relative z-10">총 등록 설비</p>
          <div className="flex items-baseline gap-2 relative z-10">
            <h3 className="text-5xl font-extrabold text-slate-800">{totalEquipmentCount}</h3>
            <span className="text-sm font-semibold text-slate-400">대</span>
          </div>
        </div>

        {/* Completed This Year */}
        <div 
          onClick={() => setModalType('completedThisYear')}
          className="bg-white rounded-3xl p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-emerald-200/50 hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className="absolute -right-6 -top-6 bg-emerald-50 w-28 h-28 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-100/50 transition-all duration-500">
            <ShieldCheck className="w-10 h-10 text-emerald-400 absolute bottom-5 left-5" />
          </div>
          <p className="text-sm font-semibold text-emerald-600 mb-2 relative z-10 flex items-center gap-1 group-hover:underline">
            올해 검사 완료 ({currentYear}년) <ArrowRight className="w-3.5 h-3.5" />
          </p>
          <div className="flex items-baseline gap-2 relative z-10">
            <h3 className="text-5xl font-extrabold text-slate-800">{completedThisYearCount}</h3>
            <span className="text-sm font-semibold text-slate-400">대</span>
          </div>
        </div>

        {/* Scheduled Next Year */}
        <div 
          onClick={() => setModalType('scheduledNextYear')}
          className="bg-white rounded-3xl p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-indigo-200/50 hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className="absolute -right-6 -top-6 bg-indigo-50 w-28 h-28 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-100/50 transition-all duration-500">
            <CalendarClock className="w-10 h-10 text-indigo-400 absolute bottom-5 left-5" />
          </div>
          <p className="text-sm font-semibold text-indigo-600 mb-2 relative z-10 flex items-center gap-1 group-hover:underline">
            내년 검사 대상 ({currentYear + 1}년) <ArrowRight className="w-3.5 h-3.5" />
          </p>
          <div className="flex items-baseline gap-2 relative z-10">
            <h3 className="text-5xl font-extrabold text-slate-800">{scheduledNextYearCount}</h3>
            <span className="text-sm font-semibold text-slate-400">대</span>
          </div>
        </div>
      </div>

      {/* Floor Plan Viewer */}
      <div className="mb-10">
        <h3 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
          공정별 도면 뷰어
        </h3>
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50 flex flex-col h-[600px] relative z-10">
          {floorPlans.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-slate-50">
              <ImageIcon className="w-16 h-16 mb-4 text-gray-200" />
              <p className="text-lg font-semibold text-gray-600 mb-2">등록된 공정 도면이 없습니다.</p>
              <p className="text-sm">좌측 메뉴의 <strong>[공정별 도면 관리]</strong> 탭에서 먼저 도면을 업로드해주세요.</p>
            </div>
          ) : (
            <>
              {/* Preload images to eliminate network delay when switching floor plans */}
              <div className="hidden">
                {floorPlans.map(plan => (
                  <img key={`preload-${plan.id}`} src={plan.imageUrl} crossOrigin="anonymous" alt="" />
                ))}
              </div>
              <FloorPlanSelector
                factories={factories}
                floorPlans={floorPlans}
                selectedPlanId={selectedPlanId}
                onSelectPlan={setSelectedPlanId}
                defaultFactoryId={selectedFactoryId === 'all' ? undefined : selectedFactoryId}
              />
              <div className="flex-1 flex flex-col lg:flex-row min-h-0">
                {/* Top/Left: Map */}
                <div className="flex-1 relative bg-slate-50/50 flex items-center justify-center p-4 cursor-crosshair group border-b lg:border-b-0 lg:border-r border-slate-100/50 min-h-[300px]">
                  {(() => {
                    const selectedPlan = floorPlans.find(p => p.id === selectedPlanId);
                    if (!selectedPlan) return <div className="text-gray-400">도면을 선택해주세요.</div>;
                    const placedEquipment = equipment.filter(eq => eq.floorPlanId === selectedPlanId && eq.locationX !== null && eq.locationY !== null);
                    return (
                      <>
                        <div className="relative inline-block max-w-full max-h-full">
                            <img 
                              crossOrigin="anonymous"
                              src={selectedPlan.imageUrl} 
                              alt={selectedPlan.name} 
                              className="max-w-full max-h-[420px] object-contain rounded-lg shadow-sm border border-slate-200/50"
                            />
                          <EquipmentLegend />
                          {placedEquipment.map((eq) => (
                            <div
                              key={eq.id}
                              className={`absolute cursor-pointer transition-all ${hoveredEqId === eq.id ? 'z-[110]' : selectedEquipmentId === eq.id ? 'z-[100]' : 'z-10'}`}
                              style={{ 
                                left: `${(eq.locationX || 0) * 100}%`, 
                                top: `${(eq.locationY || 0) * 100}%`,
                                transform: 'translate(-50%, -50%)'
                              }}
                              onMouseEnter={() => setHoveredEqId(eq.id)}
                              onMouseLeave={() => setHoveredEqId(null)}
                              onClick={(e) => {
                                e.stopPropagation();
                                const newId = selectedEquipmentId === eq.id ? null : eq.id;
                                setSelectedEquipmentId(newId);
                                if (newId) {
                                  setExpandedCategory(eq.name);
                                }
                              }}
                            >
                              <EquipmentMarker
                                equipment={eq}
                                isSelected={selectedEquipmentId === eq.id}
                              />
                              {eq.attachmentUrl && (() => {
                                const isTopHalf = (eq.locationY || 0) < 0.5;
                                const popupYTransform = hoveredEqId === eq.id ? 'translate-y-0' : (isTopHalf ? '-translate-y-2' : 'translate-y-2');
                                return (
                                  <div className={`absolute left-1/2 -translate-x-1/2 w-max max-w-[500px] min-w-[240px] bg-white/95 backdrop-blur-sm rounded-2xl p-3 shadow-2xl border border-gray-200 z-[120] cursor-default pointer-events-none transition-all duration-200 ${hoveredEqId === eq.id ? 'opacity-100 visible' : 'opacity-0 invisible'} ${isTopHalf ? 'top-full mt-3' : 'bottom-full mb-3'} ${popupYTransform}`}>
                                    <div className={`text-sm font-bold text-gray-800 text-center truncate ${!(eq.specification || eq.capacity) ? 'mb-2 border-b border-gray-100 pb-1.5' : 'mb-0.5'}`}>
                                      {eq.name}
                                    </div>
                                    {(eq.specification || eq.capacity) && (
                                      <div className="text-xs text-gray-500 text-center mb-2 border-b border-gray-100 pb-1.5 truncate">
                                        {eq.specification} {eq.capacity ? `(${eq.capacity})` : ''}
                                      </div>
                                    )}
                                    <div className="rounded-xl overflow-x-auto bg-gray-50 flex gap-2 justify-start w-full snap-x snap-mandatory pb-1 scrollbar-hide">
                                      {eq.attachmentUrl.split(',').map((url, i) => (
                                        <img key={i} crossOrigin="anonymous" src={url} alt={`설비 사진 ${i+1}`} className="max-w-full h-auto max-h-[320px] object-contain shrink-0 snap-center" />
                                      ))}
                                    </div>
                                    {/* Triangle pointer */}
                                    <div className={`absolute left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-transparent drop-shadow-sm ${isTopHalf ? '-top-2.5 border-b-[10px] border-b-white' : '-bottom-2.5 border-t-[10px] border-t-white'}`}></div>
                                  </div>
                                );
                              })()}
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Bottom/Right: Info Panel */}
                <div className="w-full lg:w-[400px] bg-white p-6 flex flex-col gap-5 overflow-y-auto z-10 lg:shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)] shrink-0 max-h-[400px] lg:max-h-full">
                  {(() => {
                    const selectedPlan = floorPlans.find(p => p.id === selectedPlanId);
                    const placedEquipment = equipment.filter(eq => eq.floorPlanId === selectedPlanId && eq.locationX !== null && eq.locationY !== null);
                    if (!selectedPlan) return null;
                    
                    const totalEq = placedEquipment.length;
                    const categories = placedEquipment.reduce((acc, eq) => {
                      const name = eq.name || '알 수 없음';
                      acc[name] = (acc[name] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>);

                    return (
                      <>
                        <h4 className="font-bold text-slate-800 text-lg border-b border-slate-100/80 pb-4 flex items-center justify-between">
                          도면 요약 정보
                        </h4>
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/30 rounded-2xl p-6 border border-blue-100/50 shadow-sm relative overflow-hidden shrink-0">
                          <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-100/50 rounded-full blur-xl"></div>
                          <div className="text-sm font-semibold text-blue-800 mb-2 relative z-10">배치된 설비 총계</div>
                          <div className="text-4xl font-extrabold text-blue-600 relative z-10 tracking-tight">{totalEq}<span className="text-base font-medium ml-1.5 text-blue-500">대</span></div>
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
                                      }`}>{count}대</span>
                                      <ArrowRight className={`w-4 h-4 transition-transform ${
                                        expandedCategory === cat ? 'rotate-90 text-blue-600' : 'text-gray-400'
                                      }`} />
                                    </div>
                                  </button>
                                  
                                  {expandedCategory === cat && (
                                    <div className="mt-1 mb-2 space-y-2 pl-3 border-l-2 border-indigo-200 animate-in slide-in-from-top-2 duration-200">
                                      {placedEquipment.filter(eq => eq.name === cat).map(eq => (
                                        <div 
                                          key={eq.id} 
                                          ref={selectedEquipmentId === eq.id ? selectedEqRef : null}
                                          onClick={() => setSelectedEquipmentId(eq.id)}
                                          className={`p-3 rounded-xl border text-xs space-y-1.5 transition-colors cursor-pointer ${
                                            selectedEquipmentId === eq.id 
                                              ? 'bg-blue-50 border-blue-400 shadow-md ring-1 ring-blue-200' 
                                              : 'bg-white border-gray-100 shadow-sm hover:border-indigo-200'
                                          }`}
                                        >
                                          <div className={`font-bold flex justify-between ${selectedEquipmentId === eq.id ? 'text-blue-900' : 'text-gray-800'}`}>
                                            <span>{eq.name}</span>
                                            {(() => {
                                              const koshaNum = eq.certificationNum || eq.recentPassNum || (eq.qrImageUrl && !eq.qrImageUrl.match(/^(http|\/|data:|blob:)/) ? eq.qrImageUrl : '');
                                              return koshaNum ? (
                                                <a 
                                                  href={`https://miis.kosha.or.kr/webm/idfNo.do?num=${koshaNum}`} 
                                                  target="_blank" 
                                                  rel="noopener noreferrer" 
                                                  className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1 z-10"
                                                  onClick={(e) => e.stopPropagation()}
                                                  title="KOSHA 안전인증 조회"
                                                >
                                                  {koshaNum}
                                                  <ExternalLink className="w-3 h-3" />
                                                </a>
                                              ) : (
                                                <span className="text-gray-400 font-normal text-[10px]">번호 없음</span>
                                              );
                                            })()}
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
                                                 eq.name.includes('압력용기') ? '㎥' : 
                                                 eq.name.includes('리프트') ? 'TON' : ''}
                                              </span>
                                            </div>
                                          )}
                                          {eq.lastInspectionDate && (
                                            <div className="text-gray-500 mt-1.5 pt-1.5 border-t border-gray-50 flex items-center gap-1">
                                              <ShieldCheck className="w-3.5 h-3.5 text-green-500"/> 
                                              최근 검사일: {eq.lastInspectionDate.substring(0, 10)}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 3-Column Layout for Bottom Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Left Col: Process Chart */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50 p-7 flex flex-col h-[520px]">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            공정(팀)별 설비 점유율
          </h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-5 custom-scrollbar">
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">데이터가 없습니다.</div>
            ) : (
              pieData.map((item, idx) => {
                const percentage = totalEquipmentCount > 0 ? Math.round((item.value / totalEquipmentCount) * 100) : 0;
                const color = COLORS[idx % COLORS.length];
                return (
                  <div key={item.name} className="flex flex-col gap-2 group cursor-default">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-bold text-gray-700 truncate pr-2 group-hover:text-blue-600 transition-colors">{item.name}</span>
                      <div className="text-right shrink-0 flex items-baseline gap-1">
                        <span className="text-base font-extrabold text-gray-900" style={{ color }}>{item.value}</span>
                        <span className="text-xs font-medium text-gray-400">대 ({percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden shadow-inner">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out relative" 
                        style={{ width: `${percentage}%`, backgroundColor: color }}
                      >
                        <div className="absolute inset-0 bg-white/20 w-full h-full"></div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Middle Col: Equipment by Type */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50 p-7 flex flex-col h-[520px]">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            설비 종류별 현황
          </h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
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
                if (item.name.includes('컨베이어')) return <ConveyorIcon className={`w-6 h-6 ${colorTheme.icon}`} />;
                if (item.name.includes('로봇')) return <Bot className={`w-6 h-6 ${colorTheme.icon}`} />;
                if (item.name.includes('압력용기')) return <Cylinder className={`w-6 h-6 ${colorTheme.icon}`} />;
                if (item.name.includes('리프트')) return <LiftIcon className={`w-6 h-6 ${colorTheme.icon}`} />;
                return <Settings className={`w-6 h-6 ${colorTheme.icon}`} />;
              };

              return (
                <div 
                  key={item.name} 
                  className={`bg-white rounded-2xl p-4 border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-default group overflow-hidden relative flex items-center justify-between ${colorTheme.border} ${colorTheme.hover}`}
                >
                  <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${colorTheme.bg} opacity-50 group-hover:scale-[2] transition-transform duration-700 ease-out`}></div>
                  <div className="relative z-10 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm bg-white border ${colorTheme.border} group-hover:scale-110 transition-transform duration-300 shrink-0`}>
                      {getIcon()}
                    </div>
                    <h4 className="text-sm font-semibold text-gray-700">{item.name}</h4>
                  </div>
                  <div className="relative z-10 flex items-baseline gap-1.5 text-right">
                    <span className={`text-2xl font-bold ${colorTheme.text}`}>{item.count}</span>
                    <span className="text-xs font-medium text-gray-400">대</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: D-Day List */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50 flex flex-col h-[520px] overflow-hidden">
          <div className="p-7 border-b border-slate-100/80 flex justify-between items-center bg-slate-50/30">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-500" />
              검사 도래 임박 설비
            </h3>
            <span className="text-xs bg-indigo-50 border border-indigo-100 text-indigo-600 px-2.5 py-1 rounded-full font-bold">Top 8</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
            {upcomingList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                <CheckCircle className="w-12 h-12 text-emerald-400" />
                <p>당분간 검사가 필요한 설비가 없습니다.</p>
              </div>
            ) : (
              <ul className="space-y-1">
                {upcomingList.map((eq, i) => {
                  const isUrgent = eq.dDay <= 30;
                  return (
                    <li key={eq.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group cursor-default">
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-gray-900 truncate">{eq.name} <span className="text-gray-500 font-normal text-xs ml-1">({eq.specification || '-'})</span></span>
                        <div className="flex items-center gap-2 text-xs mt-1">
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-medium">{eq.categoryMain || '미분류'}</span>
                          <span className="truncate text-indigo-600 font-medium">예정일: {eq.nextInspectionDate ? String(eq.nextInspectionDate).split('T')[0] : ''}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          최근 합격번호: <span className="text-gray-600">{eq.recentPassNum || '-'}</span>
                        </div>
                      </div>
                      <div className={`flex items-center justify-center px-3 py-1.5 rounded-lg font-bold text-sm shrink-0 ml-2 ${
                        isUrgent ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        D-{eq.dDay}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Law & Notifications Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Law Newsfeed Widget */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50 flex flex-col h-[400px] overflow-hidden">
          <div className="p-7 border-b border-slate-100/80 flex justify-between items-center bg-blue-50/30">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="text-xl">⚖️</span>
              안전검사 법령 및 고시 제·개정 사항
            </h3>
            <span className="text-xs bg-blue-50 border border-blue-100 text-blue-600 px-2.5 py-1 rounded-full font-bold">국가법령정보센터</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/30">
            {laws.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">데이터를 불러오는 중입니다...</div>
            ) : (
              <ul className="space-y-3">
                {laws.map(law => (
                  <li key={law.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group cursor-pointer" onClick={() => window.open(law.link, '_blank')}>
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${law.type === '입법예고' ? 'bg-orange-100 text-orange-700' : law.type === '개정' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-600'}`}>
                        {law.type}
                      </span>
                      <span className="text-xs text-gray-400 font-medium">{law.date}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {law.title}
                    </h4>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        {/* Placeholder for future widget (e.g. recent inspection logs) */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50 flex flex-col h-[400px] overflow-hidden justify-center items-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Bot className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-400 font-medium">추가 위젯 준비 중</p>
          <p className="text-xs text-gray-300 mt-2">최근 검사 이력 또는 알림 내역이 표시될 예정입니다.</p>
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
                  <><CalendarClock className="w-5 h-5 text-indigo-500" /> 내년 검사 대상 ({currentYear + 1}년)</>
                )}
              </h3>
              <button 
                onClick={() => setModalType(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 bg-white custom-scrollbar">
              {modalEquipment.length === 0 ? (
                <div className="py-12 text-center text-gray-400">해당되는 설비가 없습니다.</div>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {modalEquipment.map((eq, idx) => (
                    <li key={eq.id} className="p-4 hover:bg-blue-50/50 transition-colors flex justify-between items-center group">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                          {idx + 1}. {eq.name} <span className="text-gray-500 font-normal text-xs ml-1">({eq.specification || '-'})</span>
                        </span>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded font-medium">{eq.categoryMain || '미분류'}</span>
                          <span>|</span>
                          <span className="truncate">
                            {modalType === 'completedThisYear' ? '완료일:' : '예정일:'} 
                            <span className="text-gray-900 font-medium ml-1">
                              {modalType === 'completedThisYear' ? (eq.lastInspectionDate ? String(eq.lastInspectionDate).split('T')[0] : '') : (eq.nextInspectionDate ? String(eq.nextInspectionDate).split('T')[0] : '')}
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
