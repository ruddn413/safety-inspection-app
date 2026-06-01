import React, { useState } from 'react';
import { LayoutDashboard, Bot, Settings as SettingsIcon, Map } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { FactoryList } from './components/FactoryList';
import { FloorPlanAdmin } from './components/FloorPlanAdmin';
import { Settings } from './components/Settings';
import logo from './assets/choheung-logo.png';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="py-4 px-6 flex flex-col items-start gap-2 border-b border-gray-200">
          <img src={logo} alt="조흥 로고" className="h-8 object-contain" />
          <h1 className="text-lg font-bold text-gray-800">[안전검사 통합관리 시스템]</h1>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-colors ${
              activeTab === 'dashboard' 
                ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
            }`}
          >
            <div className={`p-1.5 rounded-lg mr-3 ${activeTab === 'dashboard' ? 'bg-blue-100' : 'bg-indigo-100'}`}>
              <LayoutDashboard className={`h-5 w-5 ${activeTab === 'dashboard' ? 'text-blue-700' : 'text-indigo-600'}`} />
            </div>
            대시보드
          </button>
          <button
            onClick={() => setActiveTab('factories')}
            className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-colors ${
              activeTab === 'factories' 
                ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
            }`}
          >
            <div className={`p-1.5 rounded-lg mr-3 ${activeTab === 'factories' ? 'bg-blue-100' : 'bg-emerald-100'}`}>
              <Bot className={`h-5 w-5 ${activeTab === 'factories' ? 'text-blue-700' : 'text-emerald-600'}`} />
            </div>
            안전검사 설비 관리
          </button>
          <button
            onClick={() => setActiveTab('floorplans')}
            className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-colors ${
              activeTab === 'floorplans' 
                ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
            }`}
          >
            <div className={`p-1.5 rounded-lg mr-3 ${activeTab === 'floorplans' ? 'bg-blue-100' : 'bg-orange-100'}`}>
              <Map className={`h-5 w-5 ${activeTab === 'floorplans' ? 'text-blue-700' : 'text-orange-600'}`} />
            </div>
            공정별 도면 관리
          </button>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-colors ${
              activeTab === 'settings' 
                ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
            }`}
          >
            <div className={`p-1.5 rounded-lg mr-3 ${activeTab === 'settings' ? 'bg-blue-100' : 'bg-slate-100'}`}>
              <SettingsIcon className={`w-5 h-5 ${activeTab === 'settings' ? 'text-blue-700' : 'text-slate-600'}`} />
            </div>
            설정 (권한)
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'factories' && <FactoryList />}
        {activeTab === 'floorplans' && <FloorPlanAdmin />}
        {activeTab === 'settings' && <Settings />}
      </main>
    </div>
  );
}

export default App;
