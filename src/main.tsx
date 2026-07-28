import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'

window.onerror = function(msg, url, line, col, error) {
  alert(`전역 에러: ${msg}`);
};

window.onunhandledrejection = function(event) {
  alert(`전역 Promise 에러: ${event.reason?.message || event.reason}`);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
