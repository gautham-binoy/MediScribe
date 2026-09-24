import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { DemoBanner } from './DemoBanner';
import { systemApi } from '@/api/client';

export const Layout: React.FC = () => {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);

  useEffect(() => {
    systemApi.getHealth()
      .then((data) => {
        if (data && typeof data.demo_mode === 'boolean') {
          setIsDemoMode(data.demo_mode);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {isDemoMode && <DemoBanner />}
        <Topbar isDemoMode={isDemoMode} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
