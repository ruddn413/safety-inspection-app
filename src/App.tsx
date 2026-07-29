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
        <div className="py-5 px-6 flex justify-center items-center border-b border-gray-200 h-[72px]">
          <img src={logo} alt="조흥 로고" className="h-8 object-contain" />
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center px-4 py-3 text-[15px] font-bold rounded-2xl transition-all duration-300 ${
              activeTab === 'dashboard' 
                ? 'bg-blue-50 text-blue-700 shadow-sm' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <div className={`p-2 rounded-xl mr-3 transition-colors ${activeTab === 'dashboard' ? 'bg-blue-100/50' : 'bg-gray-100/50'}`}>
              <LayoutDashboard className={`h-5 w-5 ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-gray-400'}`} />
            </div>
            대시보드
          </button>
          <button
            onClick={() => setActiveTab('factories')}
            className={`w-full flex items-center px-4 py-3 text-[15px] font-bold rounded-2xl transition-all duration-300 ${
              activeTab === 'factories' 
                ? 'bg-blue-50 text-blue-700 shadow-sm' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <div className={`p-2 rounded-xl mr-3 transition-colors ${activeTab === 'factories' ? 'bg-blue-100/50' : 'bg-gray-100/50'}`}>
              <Bot className={`h-5 w-5 ${activeTab === 'factories' ? 'text-blue-600' : 'text-gray-400'}`} />
            </div>
            안전검사 통합관리
          </button>
          <button
            onClick={() => setActiveTab('floorplans')}
            className={`w-full flex items-center px-4 py-3 text-[15px] font-bold rounded-2xl transition-all duration-300 ${
              activeTab === 'floorplans' 
                ? 'bg-blue-50 text-blue-700 shadow-sm' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <div className={`p-2 rounded-xl mr-3 transition-colors ${activeTab === 'floorplans' ? 'bg-blue-100/50' : 'bg-gray-100/50'}`}>
              <Map className={`h-5 w-5 ${activeTab === 'floorplans' ? 'text-blue-600' : 'text-gray-400'}`} />
            </div>
            공정별 도면 관리
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center px-4 py-3 text-[15px] font-bold rounded-2xl transition-all duration-300 ${
              activeTab === 'settings' 
                ? 'bg-blue-50 text-blue-700 shadow-sm' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <div className={`p-2 rounded-xl mr-3 transition-colors ${activeTab === 'settings' ? 'bg-blue-100/50' : 'bg-gray-100/50'}`}>
              <SettingsIcon className={`h-5 w-5 ${activeTab === 'settings' ? 'text-blue-600' : 'text-gray-400'}`} />
            </div>
            설정 (권한)
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={logout}
            className="w-full flex items-center px-4 py-3 text-[15px] font-bold rounded-2xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-300"
          >
            <div className="p-2 rounded-xl mr-3 bg-gray-100/50">
              <LogOut className="w-5 h-5 text-gray-400" />
            </div>
            로그아웃
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
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

