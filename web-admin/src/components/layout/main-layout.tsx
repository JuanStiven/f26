import React, { useState } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';

interface MainLayoutProps {
  children: React.ReactNode;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onLogout?: () => void;
  companySettings?: { name: string; logoUrl: string | null };
  currentUser?: any;
  onProfileClick?: () => void;
  onSecurityClick?: () => void;
  notificationsData?: any[];
}

export function MainLayout({ children, currentTab, setCurrentTab, theme, toggleTheme, onLogout, companySettings, currentUser, onProfileClick, onSecurityClick, notificationsData }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-200">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0">
        <Sidebar 
          collapsed={sidebarCollapsed} 
          setCollapsed={setSidebarCollapsed} 
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          companySettings={companySettings}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex w-64 max-w-xs flex-col bg-card animate-in slide-in-from-left duration-300">
            <Sidebar 
              collapsed={false} 
              setCollapsed={() => {}} 
              currentTab={currentTab}
              setCurrentTab={(tab) => {
                setCurrentTab(tab);
                setMobileMenuOpen(false);
              }}
              companySettings={companySettings}
            />
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} 
          theme={theme}
          toggleTheme={toggleTheme}
          onLogout={onLogout}
          currentUser={currentUser}
          onProfileClick={onProfileClick}
          onSecurityClick={onSecurityClick}
          notificationsData={notificationsData}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-background/50">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
