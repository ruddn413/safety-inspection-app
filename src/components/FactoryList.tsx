import React, { useEffect, useState, useRef } from 'react';
import { fetchFactories, fetchEquipment, createFactory, uploadExcel, createEquipment, type Factory, type Equipment } from '../api';

export function FactoryList() {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [selectedFactoryId, setSelectedFactoryId] = useState<number | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const EQUIPMENT_CATEGORIES = ['컨베이어', '산업용로봇', '압력용기', '혼합기'];
  
  const [showAddModal, setShowAddModal] = useState(false);
  const TARGET_FACTORIES = ['안산공장', '대소공장', '조흥GF'];
  const [newEq, setNewEq] = useState({ 
    name: '', factoryId: '', categoryMain: '', categorySub: '', categoryDetail: '', 
    specification: '', capacity: '', manufacturingNum: '', recentPassNum: '', 
    certificationNum: '', lastInspectionDate: '', nextInspectionDate: '' 
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFactories();
  }, []);

  useEffect(() => {
    loadEquipment();
  }, [selectedFactoryId]);

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

  async function handleExcelUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadExcel(file);
      alert('엑셀 업로드 성공!');
      loadFactories();
      loadEquipment();
    } catch (err) {
      console.error(err);
      alert('엑셀 업로드 실패');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleAddEquipment(e: React.FormEvent) {
    e.preventDefault();
    if (!newEq.name || !newEq.factoryId) {
      alert('공장과 설비명은 필수입니다.');
      return;
    }
    try {
      await createEquipment({
        ...newEq,
        factoryId: Number(newEq.factoryId),
        lastInspectionDate: newEq.lastInspectionDate || undefined,
        nextInspectionDate: newEq.nextInspectionDate || undefined,
      });
      setShowAddModal(false);
      setNewEq({ 
        name: '', factoryId: '', categoryMain: '', categorySub: '', categoryDetail: '', 
        specification: '', capacity: '', manufacturingNum: '', recentPassNum: '', 
        certificationNum: '', lastInspectionDate: '', nextInspectionDate: '' 
      });
      loadEquipment();
    } catch (err) {
      console.error(err);
      alert('설비 추가 실패');
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">안전검사 설비 관리</h2>
      
      <div className="w-full">
        {/* 설비 목록 */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold">공장 목록</h3>
              <select 
                value={selectedFactoryId}
                onChange={(e) => setSelectedFactoryId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[150px]"
              >
                <option value="all">전체 보기</option>
                {factories.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              
              <h3 className="text-lg font-semibold ml-2 sm:ml-4">설비 분류</h3>
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[150px]"
              >
                <option value="all">전체 보기</option>
                {EQUIPMENT_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleExcelUpload}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1 rounded text-sm hover:bg-gray-200"
              >
                엑셀 업로드
              </button>
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                설비 추가
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">공장</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">설비명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">대분류</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">규격/형식</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제조번호</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">다음 검사일</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(() => {
                  const filteredEquipment = equipment.filter(eq => {
                    if (selectedCategory === 'all') return true;
                    return eq.categoryMain === selectedCategory || eq.name.includes(selectedCategory);
                  });

                  if (filteredEquipment.length === 0) {
                    return (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                          등록된 설비가 없습니다.
                        </td>
                      </tr>
                    );
                  }

                  return filteredEquipment.map(eq => (
                    <tr key={eq.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{eq.factory?.name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{eq.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{eq.categoryMain || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{eq.specification || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{eq.manufacturingNum || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${eq.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {eq.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {eq.nextInspectionDate ? new Date(eq.nextInspectionDate).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Equipment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">새 설비 추가</h3>
            <form onSubmit={handleAddEquipment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">공장 (필수)</label>
                  <select 
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    value={newEq.factoryId}
                    onChange={e => setNewEq({...newEq, factoryId: e.target.value})}
                    required
                  >
                    <option value="">공장 선택</option>
                    {factories.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">설비명 (필수)</label>
                  <input 
                    type="text" 
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    value={newEq.name}
                    onChange={e => setNewEq({...newEq, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">대분류</label>
                  <input 
                    type="text" 
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    value={newEq.categoryMain}
                    onChange={e => setNewEq({...newEq, categoryMain: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">중분류</label>
                  <input 
                    type="text" 
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    value={newEq.categorySub}
                    onChange={e => setNewEq({...newEq, categorySub: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">규격/형식번호</label>
                  <input 
                    type="text" 
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    value={newEq.specification}
                    onChange={e => setNewEq({...newEq, specification: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">기기제조번호</label>
                  <input 
                    type="text" 
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    value={newEq.manufacturingNum}
                    onChange={e => setNewEq({...newEq, manufacturingNum: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">용량/등급</label>
                  <input 
                    type="text" 
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    value={newEq.capacity}
                    onChange={e => setNewEq({...newEq, capacity: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">기기인증번호</label>
                  <input 
                    type="text" 
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    value={newEq.certificationNum}
                    onChange={e => setNewEq({...newEq, certificationNum: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">마지막 검사일</label>
                  <input 
                    type="date" 
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    value={newEq.lastInspectionDate}
                    onChange={e => setNewEq({...newEq, lastInspectionDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">유효기간 (다음 검사일)</label>
                  <input 
                    type="date" 
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    value={newEq.nextInspectionDate}
                    onChange={e => setNewEq({...newEq, nextInspectionDate: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-8 pt-4 border-t border-gray-200">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
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
    </div>
  );
}
