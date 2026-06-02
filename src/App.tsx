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
    <div className="flex h-[100dvh] bg-[#F8FAFC] relative">
      {/* Sidebar (PC Only) */}
      <aside className="hidden md:flex w-64 bg-white shadow-[1px_0_20px_rgb(0,0,0,0.03)] flex-col z-10 relative shrink-0">
        <div className="py-5 px-6 flex flex-col items-start gap-2 border-b border-slate-100/60">
          <img src={logo} alt="조흥 로고" className="h-8 object-contain" />
          <h1 className="text-lg font-bold text-gray-800">[C'HES 안전검사 통합관리 시스템]</h1>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-2xl transition-all duration-300 ${
              activeTab === 'dashboard' 
                ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className={`p-2 rounded-xl mr-3 transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-100/50' : 'bg-slate-100/50'}`}>
              <LayoutDashboard className={`h-5 w-5 ${activeTab === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}`} />
            </div>
            대시보드
          </button>
          <button
            onClick={() => setActiveTab('factories')}
            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-2xl transition-all duration-300 ${
              activeTab === 'factories' 
                ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className={`p-2 rounded-xl mr-3 transition-colors ${activeTab === 'factories' ? 'bg-indigo-100/50' : 'bg-slate-100/50'}`}>
              <Bot className={`h-5 w-5 ${activeTab === 'factories' ? 'text-indigo-600' : 'text-slate-400'}`} />
            </div>
            안전검사 설비 관리
          </button>
          <button
            onClick={() => setActiveTab('floorplans')}
            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-2xl transition-all duration-300 ${
              activeTab === 'floorplans' 
                ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className={`p-2 rounded-xl mr-3 transition-colors ${activeTab === 'floorplans' ? 'bg-indigo-100/50' : 'bg-slate-100/50'}`}>
              <Map className={`h-5 w-5 ${activeTab === 'floorplans' ? 'text-indigo-600' : 'text-slate-400'}`} />
            </div>
            공정별 도면 관리
          </button>
        </nav>
        <div className="p-4 border-t border-slate-100/60">
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-2xl transition-all duration-300 ${
              activeTab === 'settings' 
                ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className={`p-2 rounded-xl mr-3 transition-colors ${activeTab === 'settings' ? 'bg-indigo-100/50' : 'bg-slate-100/50'}`}>
              <SettingsIcon className={`w-5 h-5 ${activeTab === 'settings' ? 'text-indigo-600' : 'text-slate-400'}`} />
            </div>
            설정 (권한)
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 w-full">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'factories' && <FactoryList />}
        {activeTab === 'floorplans' && <FloorPlanAdmin />}
        {activeTab === 'settings' && <Settings />}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex justify-around items-center px-2 py-3 z-50 shadow-[0_-4px_20px_rgb(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 w-1/4 ${activeTab === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-50' : 'bg-transparent'}`}>
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-bold">대시보드</span>
        </button>
        <button
          onClick={() => setActiveTab('factories')}
          className={`flex flex-col items-center gap-1 w-1/4 ${activeTab === 'factories' ? 'text-indigo-600' : 'text-slate-400'}`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${activeTab === 'factories' ? 'bg-indigo-50' : 'bg-transparent'}`}>
            <Bot className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-bold">설비관리</span>
        </button>
        <button
          onClick={() => setActiveTab('floorplans')}
          className={`flex flex-col items-center gap-1 w-1/4 ${activeTab === 'floorplans' ? 'text-indigo-600' : 'text-slate-400'}`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${activeTab === 'floorplans' ? 'bg-indigo-50' : 'bg-transparent'}`}>
            <Map className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-bold">도면관리</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 w-1/4 ${activeTab === 'settings' ? 'text-indigo-600' : 'text-slate-400'}`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${activeTab === 'settings' ? 'bg-indigo-50' : 'bg-transparent'}`}>
            <SettingsIcon className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-bold">설정</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
