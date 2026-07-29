import React, { useEffect, useState, useRef } from 'react';
import { fetchFactories, fetchEquipment, createFactory, uploadBulkEquipment, createEquipment, updateEquipment, deleteEquipment, uploadQrImage, type Factory, type Equipment } from '../api';
import { useAuth } from '../context/AuthContext';
import { differenceInDays, isBefore, startOfToday } from 'date-fns';
import { ExternalLink } from 'lucide-react';

const formatCapacity = (eq: Partial<Equipment>) => {
  if (!eq.capacity) return '-';
  if (/[a-zA-Z가-힣㎥³]/.test(eq.capacity)) return eq.capacity;
  if (eq.name?.includes('컨베이어')) return `${eq.capacity}m`;
  if (eq.name?.includes('로봇')) return `${eq.capacity}(대)`;
  if (eq.name?.includes('압력용기')) return `${eq.capacity}m³`;
  if (eq.name?.includes('리프트')) return `${eq.capacity}TON`;
  return eq.capacity;
};

export function FactoryList() {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const { isAdmin } = useAuth();
  const [selectedFactoryId, setSelectedFactoryId] = useState<number | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [editingEqId, setEditingEqId] = useState<number | null>(null);
  const [viewingImageEq, setViewingImageEq] = useState<Equipment | null>(null);
  const [viewingAttachmentEq, setViewingAttachmentEq] = useState<Equipment | null>(null);
  const [imageScale, setImageScale] = useState<number>(1);
  
  const EQUIPMENT_CATEGORIES = ['컨베이어', '산업용로봇', '압력용기', '혼합기', '산업용리프트'];
  const ANSAN_TEAMS = ['이스트', 'SD', '슈레드', '피자', '소스', '치즈', '골드', '혼합제제', '기타'];
  const DAESO_TEAMS = ['유탕', '피자', '밀키트', '기타'];
  const CHOHEUNG_GF_TEAMS = ['생산1팀(슈레드)', '생산2팀(가공치즈)', '기타'];
  
  const selectedFactoryName = selectedFactoryId !== 'all' ? factories.find(f => f.id === selectedFactoryId)?.name : null;
  const isAnsanSelected = selectedFactoryName === '안산공장';
  const isDaesoSelected = selectedFactoryName === '대소공장';
  const isChoheungGFSelected = selectedFactoryName === '조흥GF';

  const filteredEquipment = equipment.filter(eq => {
    const factoryMatch = selectedFactoryId === 'all' || 
                         Number(eq.factoryId) === Number(selectedFactoryId) || 
                         Number(eq.factory?.id) === Number(selectedFactoryId);

    let teamMatch = true;
    if ((isAnsanSelected || isDaesoSelected) && selectedTeam !== 'all') {
      teamMatch = (eq.categoryMain && eq.categoryMain.includes(selectedTeam)) || 
                  (eq.name && eq.name.includes(selectedTeam)) || 
                  (eq.specification && eq.specification.includes(selectedTeam)) || 
                  false;
    }
    
    let categoryMatch = true;
    if (selectedCategory !== 'all') {
      categoryMatch = (eq.specification && eq.specification.includes(selectedCategory)) || 
                      (eq.name && eq.name.includes(selectedCategory)) || 
                      false;
    }
    
    return factoryMatch && teamMatch && categoryMatch;
  });
  
  const [showAddModal, setShowAddModal] = useState(false);
  const TARGET_FACTORIES = ['안산공장', '대소공장', '조흥GF'];
  
  const emptyEq = { 
    name: '', factoryId: '', categoryMain: '', categorySub: '', categoryDetail: '', 
    specification: '', capacity: '', manufacturingNum: '', recentPassNum: '', 
    certificationNum: '', qrImageUrl: '', attachmentUrl: '', attachmentMemo: '', lastInspectionDate: '', nextInspectionDate: '' 
  };
  
  const [newEq, setNewEq] = useState(emptyEq);
  const [validityStart, setValidityStart] = useState('');
  const [validityEnd, setValidityEnd] = useState('');
  
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const qrInputRef = useRef<HTMLInputElement>(null);
  const attachInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFactories();
  }, []);

  useEffect(() => {
    loadEquipment();
  }, [selectedFactoryId]);

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      
      let imageFile: File | null = null;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          imageFile = items[i].getAsFile();
          break;
        }
      }
      if (!imageFile) return;

      if (showAddModal) {
        try {
          const res = await uploadQrImage(imageFile);
          setNewEq(prev => ({ ...prev, attachmentUrl: res.url }));
        } catch (err) {
          console.error(err);
          alert('붙여넣기 이미지 업로드 실패');
        }
      } else if (selectedIds.length === 1) {
        try {
          const res = await uploadQrImage(imageFile);
          await updateEquipment(selectedIds[0], { attachmentUrl: res.url });
          alert('선택한 설비에 첨부파일이 저장되었습니다.');
          loadEquipment();
        } catch (err) {
          console.error(err);
          alert('설비 첨부파일 저장 실패');
        }
      } else if (selectedIds.length > 1) {
        alert('첨부파일을 저장할 설비를 딱 1개만 선택해주세요.');
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [showAddModal, selectedIds]);

  async function loadFactories() {
    try {
      let data = await fetchFactories();
      let missing = false;
      for (const name of TARGET_FACTORIES) {
        if (!data.find((f: Factory) => f.name === name)) {
          await createFactory({ name });
          missing = true;
        }
      }
      if (missing) {
        data = await fetchFactories();
      }
      const filtered = data.filter((f: Factory) => TARGET_FACTORIES.includes(f.name));
      filtered.sort((a: Factory, b: Factory) => TARGET_FACTORIES.indexOf(a.name) - TARGET_FACTORIES.indexOf(b.name));
      setFactories(filtered);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadEquipment() {
    try {
      const data = await fetchEquipment(selectedFactoryId === 'all' ? undefined : selectedFactoryId);
      setEquipment(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleBulkUpload() {
    try {
      const lines = bulkText.trim().split('\n');
      if (lines.length < 2) {
        alert('올바른 엑셀 데이터(헤더 포함)를 복사하여 붙여넣어 주세요.');
        return;
      }
      
      const headers = lines[0].split('\t').map(h => h.trim());
      const data = [];
      for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i].split('\t');
        if (currentLine.length < 2) continue; // 빈 줄 무시
        const obj: any = {};
        headers.forEach((h, j) => {
          obj[h] = currentLine[j]?.trim() || '';
        });
        data.push(obj);
      }

      const res = await uploadBulkEquipment(data);
      alert(res.message);
      setIsBulkModalOpen(false);
      setBulkText('');
      await loadFactories();
      await loadEquipment();
    } catch(err) {
      console.error(err);
      alert('업로드 중 오류가 발생했습니다.');
    }
  }

  function handleEditClick() {
    if (selectedIds.length !== 1) return;
    const eq = equipment.find(e => e.id === selectedIds[0]);
    if (!eq) return;
    
    setEditingEqId(eq.id);
    setNewEq({
      name: eq.name || '',
      factoryId: String(eq.factoryId || ''),
      categoryMain: eq.categoryMain || '',
      categorySub: eq.categorySub || '',
      categoryDetail: eq.categoryDetail || '',
      specification: eq.specification || '',
      capacity: eq.capacity || '',
      manufacturingNum: eq.manufacturingNum || '',
      recentPassNum: eq.recentPassNum || '',
      certificationNum: eq.certificationNum || '',
      qrImageUrl: eq.qrImageUrl || '',
      attachmentUrl: eq.attachmentUrl || '',
      attachmentMemo: eq.attachmentMemo || '',
      lastInspectionDate: eq.lastInspectionDate ? new Date(eq.lastInspectionDate).toISOString().split('T')[0] : '',
      nextInspectionDate: eq.nextInspectionDate ? new Date(eq.nextInspectionDate).toISOString().split('T')[0] : ''
    });
    setValidityStart(eq.lastInspectionDate ? new Date(eq.lastInspectionDate).toISOString().split('T')[0] : '');
    setValidityEnd(eq.nextInspectionDate ? new Date(eq.nextInspectionDate).toISOString().split('T')[0] : '');
    setShowAddModal(true);
  }

  async function handleAddEquipment(e: React.FormEvent) {
    e.preventDefault();
    alert('저장 버튼 클릭됨! 데이터 검증 시작...');
    if (!newEq.name || !newEq.factoryId) {
      alert('공장과 설비명은 필수입니다.');
      return;
    }
    try {
      const payload = {
        ...newEq,
        factoryId: Number(newEq.factoryId),
        lastInspectionDate: validityStart ? validityStart : undefined,
        nextInspectionDate: newEq.nextInspectionDate || (validityEnd ? validityEnd : undefined),
      };

      if (editingEqId) {
        await updateEquipment(editingEqId, payload);
      } else {
        await createEquipment(payload);
      }
      
      setShowAddModal(false);
      setNewEq(emptyEq);
      setValidityStart('');
      setValidityEnd('');
      setEditingEqId(null);
      loadEquipment();
    } catch (error: any) {
      console.error(error);
      const msg = editingEqId ? '설비 수정 실패' : '설비 추가 실패';
      alert(`${msg}: ${error.message || String(error)}`);
    }
  }

  async function handleDeleteEquipment() {
    if (selectedIds.length === 0) return;
    if (!confirm(`선택한 ${selectedIds.length}개의 설비를 정말 삭제하시겠습니까?`)) return;
    
    try {
      await deleteEquipment(selectedIds);
      setSelectedIds([]);
      loadEquipment();
    } catch (err) {
      console.error(err);
      alert('설비 삭제 실패');
    }
  }

  async function handleQrUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // 1. 이미지 서버 업로드 (저장)
      const res = await uploadQrImage(file);
      setNewEq(prev => ({ ...prev, qrImageUrl: res.url }));
    } catch(err) {
      console.error("이미지 업로드 실패", err);
      alert('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      if (qrInputRef.current) qrInputRef.current.value = '';
    }
  }

  async function handleAttachUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const uploadPromises = Array.from(files).map(f => uploadQrImage(f));
      const results = await Promise.all(uploadPromises);
      const newUrls = results.map(r => r.url).join(',');
      
      setNewEq(prev => {
        const updatedUrl = prev.attachmentUrl ? prev.attachmentUrl + ',' + newUrls : newUrls;
        return { ...prev, attachmentUrl: updatedUrl };
      });
    } catch(err) {
      console.error("이미지 업로드 실패", err);
    } finally {
      if (attachInputRef.current) attachInputRef.current.value = '';
    }
  }

  const modalFactoryName = factories.find(f => String(f.id) === String(newEq.factoryId))?.name;
  const baseTeams = modalFactoryName === '대소공장' 
    ? DAESO_TEAMS 
    : modalFactoryName === '안산공장' 
      ? ANSAN_TEAMS 
      : modalFactoryName === '조흥GF'
        ? CHOHEUNG_GF_TEAMS
        : Array.from(new Set([...ANSAN_TEAMS, ...DAESO_TEAMS, ...CHOHEUNG_GF_TEAMS]));
  const modalTeams = newEq.categoryMain && !baseTeams.includes(newEq.categoryMain)
    ? [newEq.categoryMain, ...baseTeams]
    : baseTeams;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">안전검사 설비 관리</h2>
      
      <div className="w-full">
        {/* 설비 목록 */}
        <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100">
          <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center mb-6 gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              <h3 className="text-lg font-semibold shrink-0 w-full sm:w-auto mb-2 sm:mb-0">공장 목록</h3>
              <select 
                value={selectedFactoryId}
                onChange={(e) => {
                  setSelectedFactoryId(e.target.value === 'all' ? 'all' : Number(e.target.value));
                  setSelectedTeam('all');
                }}
                className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white min-w-[150px] shadow-sm transition-all hover:border-indigo-300"
              >
                <option value="all">전체 보기</option>
                {factories.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              
              {(isAnsanSelected || isDaesoSelected || isChoheungGFSelected) && (
                <>
                  <h3 className="text-lg font-semibold ml-2 sm:ml-4">공정 분류</h3>
                  <select 
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white min-w-[130px] shadow-sm transition-all hover:border-indigo-300"
                  >
                    <option value="all">전체 보기</option>
                    {(isChoheungGFSelected ? CHOHEUNG_GF_TEAMS : isDaesoSelected ? DAESO_TEAMS : ANSAN_TEAMS).map(team => (
                      <option key={team} value={team}>{team}</option>
                    ))}
                  </select>
                </>
              )}
              
              <h3 className="text-lg font-semibold ml-2 sm:ml-4">설비 분류</h3>
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white min-w-[150px] shadow-sm transition-all hover:border-indigo-300"
              >
                <option value="all">전체 보기</option>
                {EQUIPMENT_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <div className="ml-2 sm:ml-4 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-semibold border border-indigo-100 flex items-center shadow-sm">
                총 {filteredEquipment.length}대
              </div>
            </div>
            
            {isAdmin && (
              <div className="flex flex-wrap items-center gap-2 mt-2 xl:mt-0 w-full xl:w-auto justify-end border-t xl:border-t-0 pt-4 xl:pt-0 border-slate-100/60">
                <button 
                  onClick={() => {
                    setEditingEqId(null);
                    setNewEq(emptyEq);
                    setValidityStart('');
                    setValidityEnd('');
                    setShowAddModal(true);
                  }}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  설비 추가
                </button>
                <button 
                  onClick={handleEditClick}
                  disabled={selectedIds.length !== 1}
                  className={`px-3 py-1 rounded text-sm ${selectedIds.length !== 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  선택 수정
                </button>
                <button 
                  onClick={handleDeleteEquipment}
                  disabled={selectedIds.length === 0}
                  className={`px-3 py-1 rounded text-sm ${selectedIds.length === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' : 'bg-red-600 text-white hover:bg-red-700'}`}
                >
                  선택 삭제
                </button>
                <button 
                  onClick={() => setIsBulkModalOpen(true)}
                  className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-sm hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all font-medium"
                >
                  엑셀 붙여넣기
                </button>
              </div>
            )}
          </div>
          
          <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-10">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(filteredEquipment.map(eq => eq.id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                      checked={filteredEquipment.length > 0 && selectedIds.length === filteredEquipment.length}
                    />
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">공장</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">유해·위험기계명</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">형식(규격)</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">기기번호</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">용량</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">검사유효기간</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">합격번호</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">QR코드 번호</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">비고</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">첨부파일</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100/60">
                {filteredEquipment.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-4 text-center text-sm text-gray-500">
                      등록된 설비가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredEquipment.map(eq => (
                    <tr key={eq.id} className="hover:bg-slate-50/80 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50 w-4 h-4"
                          checked={selectedIds.includes(eq.id)}
                          disabled={!isAdmin}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds(prev => [...prev, eq.id]);
                            } else {
                              setSelectedIds(prev => prev.filter(id => id !== eq.id));
                            }
                          }}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{eq.factory?.name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">{eq.name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{eq.specification || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{eq.manufacturingNum || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{formatCapacity(eq)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium text-center">
                        {eq.lastInspectionDate ? new Date(eq.lastInspectionDate).toLocaleDateString() : (eq.nextInspectionDate ? '?' : '-')} ~ {eq.nextInspectionDate ? new Date(eq.nextInspectionDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                        {(() => {
                          const koshaNum = eq.recentPassNum;
                          return koshaNum ? (
                            <a href={`https://miis.kosha.or.kr/webm/idfNo.do?num=${koshaNum}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1" title="KOSHA 안전인증 조회">
                              {koshaNum} <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : '-';
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        {(() => {
                          const koshaNum = eq.certificationNum;
                          return koshaNum ? (
                            <a href={`https://miis.kosha.or.kr/webm/idfNo.do?num=${koshaNum}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1" title="KOSHA 안전인증 조회">
                              {koshaNum} <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : '-';
                        })()}
                        {eq.qrImageUrl && (
                          <button 
                            onClick={() => { setViewingImageEq(eq); setImageScale(1); }}
                            className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                          >
                            사진 보기
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{eq.categoryDetail || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {eq.attachmentUrl ? (
                          <button 
                            onClick={() => { setViewingAttachmentEq(eq); setImageScale(1); }}
                            className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-indigo-50 text-indigo-600 border border-indigo-200 rounded hover:bg-indigo-100 transition-colors"
                          >
                            첨부파일 보기
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Equipment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">{editingEqId ? '설비 수정' : '새 설비 추가'}</h3>
            <form onSubmit={handleAddEquipment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">공장 (필수)</label>
                  <select 
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    value={newEq.factoryId}
                    onChange={e => setNewEq({...newEq, factoryId: e.target.value, categoryMain: ''})}
                    required
                  >
                    <option value="">공장 선택</option>
                    {factories.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">유해·위험기계명 (필수)</label>
                  <select
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
                    value={newEq.name}
                    onChange={e => setNewEq({...newEq, name: e.target.value})}
                    required
                  >
                    <option value="" disabled>기계명 선택</option>
                    {EQUIPMENT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">형식(규격)</label>
                  <input 
                    type="text" 
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    value={newEq.specification}
                    onChange={e => setNewEq({...newEq, specification: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">공정/팀 (필수)</label>
                  <select
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
                    value={newEq.categoryMain}
                    onChange={e => setNewEq({...newEq, categoryMain: e.target.value})}
                    required
                  >
                    <option value="" disabled>공정/팀 선택</option>
                    {modalTeams.map(team => (
                      <option key={team} value={team}>{team}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">기기번호</label>
                  <input 
                    type="text" 
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    value={newEq.manufacturingNum}
                    onChange={e => setNewEq({...newEq, manufacturingNum: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    용량 {newEq.name?.includes('컨베이어') ? '(단위: m)' : newEq.name?.includes('산업용로봇') ? '(단위: 대)' : newEq.name?.includes('압력용기') ? '(단위: m³)' : newEq.name?.includes('리프트') ? '(단위: TON)' : '(m/EA)'}
                  </label>
                  <input 
                    type="text" 
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    value={newEq.capacity}
                    onChange={e => setNewEq({...newEq, capacity: e.target.value})}
                    placeholder={newEq.name?.includes('리프트') ? '예: 5 (숫자만 입력 시 TON 자동 표시)' : ''}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">검사유효기간 (시작일 ~ 종료일)</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input 
                      type="date" 
                      className="block w-full rounded-md border border-gray-300 px-3 py-2"
                      value={validityStart}
                      onChange={e => setValidityStart(e.target.value)}
                    />
                    <span className="text-gray-500">~</span>
                    <input 
                      type="date" 
                      className="block w-full rounded-md border border-gray-300 px-3 py-2"
                      value={validityEnd}
                      onChange={e => setValidityEnd(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">차기 검사일 (필수)</label>
                  <input 
                    type="date" 
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    value={newEq.nextInspectionDate}
                    onChange={e => setNewEq({...newEq, nextInspectionDate: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">검사합격번호</label>
                  <input 
                    type="text" 
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    value={newEq.recentPassNum}
                    onChange={e => setNewEq({...newEq, recentPassNum: e.target.value})}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">QR코드 번호 및 사진 업로드 (선택)</label>
                  <div className="mt-1 flex gap-2 items-start">
                    <div className="flex-1">
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          className="block w-full rounded-md border border-gray-300 px-3 py-2"
                          value={newEq.certificationNum}
                          onChange={e => setNewEq({...newEq, certificationNum: e.target.value})}
                          placeholder="번호 직접 입력 (예: 23-12-300069)"
                        />
                        <input 
                          type="file" 
                          accept="image/*,.pdf" 
                          className="hidden" 
                          ref={qrInputRef}
                          onChange={handleQrUpload}
                        />
                        <button 
                          type="button"
                          onClick={() => qrInputRef.current?.click()}
                          className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-2 rounded-md hover:bg-indigo-100 whitespace-nowrap text-sm"
                        >
                          사진 업로드
                        </button>
                      </div>
                      {newEq.qrImageUrl && (
                        <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200 inline-block">
                          <img src={newEq.qrImageUrl} alt="미리보기" className="h-20 object-contain" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">첨부파일 (선택) - <span className="text-indigo-600 font-normal">Ctrl+V로 바로 붙여넣기 가능</span></label>
                  <div className="mt-1 flex gap-2 items-start">
                    <div className="flex-1">
                      <div className="flex gap-2">
                        <input 
                          type="file" 
                          accept="image/*,.pdf" 
                          multiple
                          className="hidden" 
                          ref={attachInputRef}
                          onChange={handleAttachUpload}
                        />
                        <button 
                          type="button"
                          onClick={() => attachInputRef.current?.click()}
                          className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-2 rounded-md hover:bg-indigo-100 whitespace-nowrap text-sm"
                        >
                          첨부파일 업로드
                        </button>
                        {newEq.attachmentUrl && (
                          <span className="text-sm text-green-600 flex items-center ml-2">✓ 이미지가 업로드되었습니다.</span>
                        )}
                      </div>
                      {newEq.attachmentUrl && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {newEq.attachmentUrl.split(',').map((url, idx) => (
                            <div key={idx} className="p-2 bg-gray-50 rounded border border-gray-200 inline-block">
                              <img src={url} alt={`첨부파일 미리보기 ${idx+1}`} className="h-20 object-contain" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">비고 (공정/라인명 등)</label>
                  <input 
                    type="text" 
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    value={newEq.categoryDetail}
                    onChange={e => setNewEq({...newEq, categoryDetail: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-8 pt-4 border-t border-gray-200">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingEqId(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">엑셀 데이터 붙여넣기 (사내 보안 우회)</h2>
              <p className="text-sm text-gray-600 mb-4">
                사내 보안 프로그램으로 인해 파일 직접 업로드가 불가한 경우 사용합니다.<br/>
                기존 엑셀 파일에서 <strong>첫 번째 줄(헤더 이름)부터 마지막 줄까지 전체를 드래그 복사(Ctrl+C)</strong> 한 뒤, 아래 빈 칸에 <strong>붙여넣기(Ctrl+V)</strong> 해주세요.
              </p>
              
              <textarea 
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                className="w-full h-[400px] border border-gray-300 rounded-md p-3 text-sm font-mono whitespace-pre overflow-auto"
                placeholder="여기에 복사한 엑셀 데이터를 붙여넣으세요..."
              />

              <div className="mt-6 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                >
                  취소
                </button>
                <button 
                  type="button"
                  onClick={handleBulkUpload}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
                >
                  데이터 저장하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {viewingImageEq && viewingImageEq.qrImageUrl && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-4">
                <h3 className="font-semibold text-gray-800">QR코드 사진</h3>
                <div className="flex bg-white border border-gray-300 rounded-md overflow-hidden text-sm">
                  <button onClick={() => setImageScale(s => Math.max(0.5, s - 0.5))} className="px-3 py-1 hover:bg-gray-100 border-r border-gray-300 font-medium">-</button>
                  <span className="px-3 py-1 bg-gray-50 text-gray-600 font-medium">{Math.round(imageScale * 100)}%</span>
                  <button onClick={() => setImageScale(s => Math.min(1.5, s + 0.5))} className="px-3 py-1 hover:bg-gray-100 border-l border-gray-300 font-medium">+</button>
                </div>
                <span className="text-xs text-gray-500">※ 사진을 클릭하셔도 확대됩니다.</span>
              </div>
              <button onClick={() => setViewingImageEq(null)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto bg-gray-200 flex justify-center items-start min-h-[400px]">
              <img 
                src={viewingImageEq.qrImageUrl} 
                alt="QR Code" 
                onClick={() => setImageScale(s => s >= 1.5 ? 1 : s + 0.5)}
                style={{ 
                  width: imageScale === 1 ? 'auto' : `${imageScale * 100}%`, 
                  maxHeight: imageScale === 1 ? '70vh' : 'none',
                  maxWidth: imageScale === 1 ? '100%' : 'none',
                  imageRendering: '-webkit-optimize-contrast',
                  filter: 'contrast(1.05) brightness(1.02)'
                }}
                className={`bg-white shadow-md transition-all duration-200 ${imageScale >= 1.5 ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
              />
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-between bg-white">
              {isAdmin && (
                <button 
                  onClick={async () => {
                    if (confirm('이 사진을 정말 삭제하시겠습니까?')) {
                      try {
                        await updateEquipment(viewingImageEq.id, { qrImageUrl: '' });
                        setViewingImageEq(null);
                        loadEquipment();
                      } catch (err) {
                        alert('삭제에 실패했습니다.');
                      }
                    }
                  }}
                  className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 font-medium"
                >
                  사진 삭제
                </button>
              )}
              <button 
                onClick={() => setViewingImageEq(null)}
                className={`px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 font-medium ${!isAdmin ? 'w-full' : ''}`}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Viewer Modal */}
      {viewingAttachmentEq && viewingAttachmentEq.attachmentUrl && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-4">
                <h3 className="font-semibold text-gray-800">첨부파일 사진</h3>
                <div className="flex bg-white border border-gray-300 rounded-md overflow-hidden text-sm">
                  <button onClick={() => setImageScale(s => Math.max(0.5, s - 0.5))} className="px-3 py-1 hover:bg-gray-100 border-r border-gray-300 font-medium">-</button>
                  <span className="px-3 py-1 bg-gray-50 text-gray-600 font-medium">{Math.round(imageScale * 100)}%</span>
                  <button onClick={() => setImageScale(s => Math.min(4, s + 0.5))} className="px-3 py-1 hover:bg-gray-100 border-l border-gray-300 font-medium">+</button>
                </div>
                <span className="text-xs text-gray-500">※ 사진을 클릭하셔도 확대됩니다.</span>
              </div>
              <button onClick={() => setViewingAttachmentEq(null)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto bg-gray-200 flex flex-wrap gap-2 justify-center content-start min-h-[400px]">
              {viewingAttachmentEq.attachmentUrl.split(',').map((url, idx) => (
                <img 
                  key={idx}
                  src={url} 
                  alt={`Attachment ${idx+1}`} 
                  onClick={() => setImageScale(s => s >= 1.5 ? 1 : s + 0.5)}
                  style={{ 
                    width: imageScale === 1 ? 'auto' : `${imageScale * 100}%`, 
                    maxHeight: imageScale === 1 ? '50vh' : 'none',
                    maxWidth: imageScale === 1 ? '100%' : 'none',
                    imageRendering: '-webkit-optimize-contrast',
                    filter: 'contrast(1.05) brightness(1.02)'
                  }}
                  className={`bg-white shadow-md transition-all duration-200 ${imageScale >= 1.5 ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                />
              ))}
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
              <div className="flex-1 mr-4">
                <input 
                  type="text" 
                  placeholder={isAdmin ? "여기에 간단한 메모를 작성하세요..." : "메모가 없습니다."}
                  value={viewingAttachmentEq.attachmentMemo || ''}
                  onChange={(e) => isAdmin && setViewingAttachmentEq(prev => prev ? {...prev, attachmentMemo: e.target.value} : null)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${!isAdmin ? 'bg-gray-100 cursor-not-allowed text-gray-600' : ''}`}
                  readOnly={!isAdmin}
                />
              </div>
              {isAdmin && (
                <>
                  <button 
                    onClick={async () => {
                      try {
                        await updateEquipment(viewingAttachmentEq.id, { attachmentMemo: viewingAttachmentEq.attachmentMemo });
                        alert('메모가 저장되었습니다.');
                        loadEquipment();
                      } catch (err) {
                        alert('메모 저장에 실패했습니다.');
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white border border-transparent rounded-md shadow-sm hover:bg-indigo-700 font-medium whitespace-nowrap mr-2"
                  >
                    메모 저장
                  </button>
                  <button 
                    onClick={async () => {
                      if (confirm('이 첨부파일을 정말 삭제하시겠습니까?')) {
                        try {
                          await updateEquipment(viewingAttachmentEq.id, { attachmentUrl: '' });
                          setViewingAttachmentEq(null);
                          loadEquipment();
                        } catch (err) {
                          alert('삭제에 실패했습니다.');
                        }
                      }
                    }}
                    className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 font-medium mr-2"
                  >
                    사진 삭제
                  </button>
                </>
              )}
              <button 
                onClick={() => setViewingAttachmentEq(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 font-medium"
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
