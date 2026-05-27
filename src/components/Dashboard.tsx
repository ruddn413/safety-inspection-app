import React, { useEffect, useState } from 'react';
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

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">대시보드</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">등록된 공장</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{factoryCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">총 설비 수</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{summary?.totalEquipment || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 border-l-4 border-l-red-500">
          <h3 className="text-sm font-medium text-gray-500">검사 도래 (30일 이내)</h3>
          <p className="mt-2 text-3xl font-semibold text-red-600">{summary?.approaching || 0}</p>
        </div>
      </div>
      <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">최근 알림</h3>
        {(summary?.overdue || 0) > 0 && (
          <p className="text-red-600 text-sm font-semibold mb-2">
            ⚠️ 검사 기한이 지난 설비가 {summary?.overdue}건 있습니다.
          </p>
        )}
        <p className="text-gray-500 text-sm">추가 알림 내용이 여기에 표시됩니다.</p>
      </div>
    </div>
  );
}
