import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ShieldCheck, LogIn, LogOut } from 'lucide-react';

export function Settings() {
  const { isAdmin, login, logout, username } = useAuth();
  const [inputUsername, setInputUsername] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/login', {
        username: inputUsername,
        password: inputPassword,
      });
      const { token, role, username: loggedInUser } = response.data;
      login(token, role, loggedInUser);
      setInputUsername('');
      setInputPassword('');
    } catch (err) {
      setError('아이디 또는 비밀번호가 일치하지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
        {isAdmin ? (
          <ShieldCheck className="w-6 h-6 text-emerald-500" />
        ) : (
          <ShieldAlert className="w-6 h-6 text-amber-500" />
        )}
        <h2 className="text-xl font-bold text-gray-800">접근 권한 설정</h2>
      </div>

      <div className="p-6">
        {isAdmin ? (
          <div className="space-y-6">
            <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">관리자(Admin) 권한이 활성화되었습니다.</p>
                <p className="text-sm mt-1 opacity-90">설비 추가, 도면 수정, 데이터 삭제 등의 모든 편집 권한을 사용할 수 있습니다.</p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-4">현재 로그인된 계정: <span className="font-semibold text-gray-700">{username}</span></p>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
              >
                <LogOut className="w-5 h-5" />
                로그아웃 (조회 모드로 전환)
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="bg-amber-50 text-amber-800 p-4 rounded-xl flex items-start gap-3 mb-6">
              <ShieldAlert className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">현재 조회(Viewer) 모드입니다.</p>
                <p className="text-sm mt-1 opacity-90">데이터를 수정하려면 관리자 아이디와 패스워드를 입력하여 권한을 부여받으세요.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">아이디</label>
              <input
                type="text"
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="관리자 아이디 입력"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
              <input
                type="password"
                value={inputPassword}
                onChange={(e) => setInputPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="비밀번호 입력"
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              <LogIn className="w-5 h-5" />
              {loading ? '인증 중...' : '권한 부여받기'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
