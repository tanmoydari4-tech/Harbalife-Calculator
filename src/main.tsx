import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Application recovered from error:', error);
    try {
      localStorage.removeItem('hl_admin_settings_v1');
      localStorage.removeItem('hl_admin_products_v1');
    } catch {
      // ignore
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F4F7F5] p-6 text-center">
          <div className="bg-white border border-[#DCE5DF] rounded-xl p-6 max-w-sm space-y-3">
            <h1 className="text-base font-bold text-[#14211B]">Herbalife Price & VP Calculator</h1>
            <p className="text-xs text-[#5A6B63]">Reloading application state...</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-xs font-bold bg-[#1E562A] text-white rounded-lg cursor-pointer"
            >
              Reload Calculator
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

(window as unknown as { __APP_MOUNTED__?: boolean }).__APP_MOUNTED__ = true;

createRoot(document.getElementById('root')!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
