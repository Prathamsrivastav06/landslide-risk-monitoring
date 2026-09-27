import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard';
import PredictStudio from './pages/PredictStudio';
import Architecture from './pages/Architecture';
import Analytics from './pages/Analytics';
import FieldReport from './pages/FieldReport';
import Alerts from './pages/Alerts';
import DataSources from './pages/DataSources';
import Limitations from './pages/Limitations';
import Login from './pages/Login';
import Navbar from './components/common/Navbar';

import ErrorBoundary from './components/common/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 60000 } }
});

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <div className="flex flex-col min-h-screen bg-command-bg">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/predict" element={<PredictStudio />} />
                  <Route path="/alerts" element={<Alerts />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/field" element={<FieldReport />} />
                  <Route path="/architecture" element={<Architecture />} />
                  <Route path="/data-sources" element={<DataSources />} />
                  <Route path="/sources" element={<Navigate to="/data-sources" replace />} />
                  <Route path="/limitations" element={<Limitations />} />
                  <Route path="/login" element={<Login />} />
                </Routes>
              </main>
            </div>
            <Toaster
              position="top-right"
              toastOptions={{
                style: { background: '#111a2e', color: '#e2e8f0', border: '1px solid rgba(56,189,248,0.3)' },
                error: { iconTheme: { primary: '#f87171', secondary: '#111a2e' } }
              }}
            />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
