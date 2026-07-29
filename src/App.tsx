import React, { useState } from 'react';
import { LayoutDashboard, Bot, Settings as SettingsIcon, Map, ChevronDown, ChevronRight, LogOut, User } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { FactoryList } from './components/FactoryList';
import { FloorPlanAdmin } from './components/FloorPlanAdmin';
import { Settings } from './components/Settings';
import logo from './assets/choheung-logo.png';
import { useAuth } from './context/AuthContext';

function App() {
  const [activeTab, setActiveTab] = useState('factories');
  const [safetyOpen, setSafetyOpen] = useState(true);
  const { logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: '대시보드' },
    { id: 'factories', label: '안전검사 통합관리' },
    { id: 'floorplans', label: '공정별 도면 관리' },
    { id: 'settings', label: '설정' }
  ];

  return (
    <div className="flex h-[100dvh] bg-[#F4F6F8] font-sans">
      {/* Sidebar (PC Only) */}
      <aside className="hidden md:flex w-64 bg-white flex-col z-20 shrink-0 border-r border-gray-200">
        <div className="py-4 px-5 flex items-center gap-2 border-b border-gray-200">
          <img src={logo} alt="조흥 로고" className="h-6 object-contain" />
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-gray-800 leading-tight">체스 C'HES</span>
            <span className="text-[9px] text-gray-500 leading-tight">조흥 보건/환경/안전 관리 시스템</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-4 py-2 flex items-center justify-between text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50">
            <span>공통</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
          
          <div>
            <div 
              className="px-4 py-2 flex items-center justify-between text-sm font-bold text-gray-800 cursor-pointer hover:bg-gray-50"
              onClick={() => setSafetyOpen(!safetyOpen)}
            >
              <span>안전</span>
              {safetyOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
            </div>
            
            {safetyOpen && (
              <div className="flex flex-col py-1">
                {menuItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`text-left px-10 py-2.5 text-[13px] transition-colors border-l-4 ${
                      activeTab === item.id 
                        ? 'border-blue-600 bg-blue-50/50 text-blue-700 font-bold' 
                        : 'border-transparent text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="px-4 py-2 mt-1 flex items-center justify-between text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50">
            <span>보건</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
          <div className="px-4 py-2 flex items-center justify-between text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50">
            <span>환경</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
          <div className="px-4 py-2 flex items-center justify-between text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50">
            <span>소방</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
          <div className="px-4 py-2 flex items-center justify-between text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50">
            <span>기타</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={logout}
            className="w-full py-2 px-4 flex items-center justify-center gap-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-14 bg-white/50 backdrop-blur-sm border-b border-gray-200 flex items-center justify-end px-6 shrink-0 z-10">
          <div className="flex items-center border border-gray-300 rounded px-3 py-1.5 bg-white shadow-sm cursor-pointer hover:bg-gray-50">
            <span className="text-[13px] font-medium text-gray-700">관리자장</span>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-8">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'factories' && <FactoryList />}
          {activeTab === 'floorplans' && <FloorPlanAdmin />}
          {activeTab === 'settings' && <Settings />}
        </main>
      </div>

      {/* Mobile Bottom Navigation (Preserved for mobile usability) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center px-2 py-3 z-50 shadow-[0_-4px_20px_rgb(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 w-1/4 ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${activeTab === 'dashboard' ? 'bg-blue-50' : 'bg-transparent'}`}>
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-bold">대시보드</span>
        </button>
        <button
          onClick={() => setActiveTab('factories')}
          className={`flex flex-col items-center gap-1 w-1/4 ${activeTab === 'factories' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${activeTab === 'factories' ? 'bg-blue-50' : 'bg-transparent'}`}>
            <Bot className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-bold">설비관리</span>
        </button>
        <button
          onClick={() => setActiveTab('floorplans')}
          className={`flex flex-col items-center gap-1 w-1/4 ${activeTab === 'floorplans' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${activeTab === 'floorplans' ? 'bg-blue-50' : 'bg-transparent'}`}>
            <Map className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-bold">도면관리</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 w-1/4 ${activeTab === 'settings' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${activeTab === 'settings' ? 'bg-blue-50' : 'bg-transparent'}`}>
            <SettingsIcon className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-bold">설정</span>
        </button>
      </nav>
    </div>
  );
}

export default App;

