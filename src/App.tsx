import React, { useState, useEffect } from 'react';
import { SkipLink } from './components/common/SkipLink';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { MobileNav } from './components/common/MobileNav';
import { MoreMenuModal } from './components/common/MoreMenuModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';

import { DashboardView } from './components/dashboard/DashboardView';
import { VisionView } from './components/vision/VisionView';
import { ConversationView } from './components/conversation/ConversationView';
import { EasyReadView } from './components/easyread/EasyReadView';
import { DocumentView } from './components/documents/DocumentView';
import { HistoryView } from './components/history/HistoryView';
import { SettingsView } from './components/settings/SettingsView';

import { AccessibilitySettings, UserProfile } from './types';
import { DEFAULT_ACCESSIBILITY_SETTINGS } from './constants';
import { initAnonymousAuth } from './lib/firebase';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>('/');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Load accessibility settings from localStorage
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    try {
      const saved = localStorage.getItem('lovira_accessibility_settings');
      if (saved) {
        return { ...DEFAULT_ACCESSIBILITY_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_ACCESSIBILITY_SETTINGS;
  });

  // Handle Hash Routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || '/';
      setCurrentRoute(hash);
      window.scrollTo(0, 0);
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Initialize Firebase Auth
  useEffect(() => {
    initAnonymousAuth().then((profile) => {
      setUserProfile(profile);
    });
  }, []);

  // Update Settings
  const handleUpdateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('lovira_accessibility_settings', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const navigateTo = (route: string) => {
    window.location.hash = `#${route}`;
    setCurrentRoute(route);
  };

  // Determine dark mode & contrast classes
  const isDark = settings.theme === 'dark';

  // Synchronize accessibility attributes with document.documentElement
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    if (settings.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    const scaleVal = (parseFloat(settings.fontScale) || 100) / 100;
    document.documentElement.style.setProperty('--font-scale', scaleVal.toString());
  }, [isDark, settings.highContrast, settings.fontScale]);

  return (
    <div
      className={`min-h-screen flex flex-col bg-canvas text-text-primary ${
        settings.reducedMotion ? 'reduce-motion' : ''
      } ${settings.largeControls ? 'large-controls' : ''}`}
    >
      <SkipLink />

      {/* Global Top Header Bar */}
      <Header
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        userProfile={userProfile}
        onNavigate={navigateTo}
      />

      {/* Workspace Area: Sidebar + Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar
          currentRoute={currentRoute}
          onNavigate={navigateTo}
          userProfile={userProfile}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
        />

        {/* Main Content Viewport */}
        <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-28 sm:pb-8 max-w-7xl mx-auto w-full outline-none">
          <ErrorBoundary key={currentRoute}>
            {currentRoute === '/' && (
              <DashboardView
                userProfile={userProfile}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onNavigate={navigateTo}
              />
            )}

            {currentRoute.startsWith('/vision') && (
              <VisionView
                userProfile={userProfile}
                settings={settings}
                initialAction={currentRoute.includes('action=camera') ? 'camera' : undefined}
              />
            )}

            {currentRoute.startsWith('/conversation') && (
              <ConversationView
                userProfile={userProfile}
                settings={settings}
                onNavigate={navigateTo}
              />
            )}

            {currentRoute.startsWith('/easy-read') && (
              <EasyReadView
                userProfile={userProfile}
                settings={settings}
              />
            )}

            {currentRoute.startsWith('/documents') && (
              <DocumentView
                userProfile={userProfile}
                settings={settings}
              />
            )}

            {currentRoute.startsWith('/history') && (
              <HistoryView userProfile={userProfile} />
            )}

            {currentRoute.startsWith('/settings') && (
              <SettingsView
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                userProfile={userProfile}
              />
            )}
          </ErrorBoundary>
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav
        currentRoute={currentRoute}
        onNavigate={navigateTo}
        onOpenMoreMenu={() => setIsMoreMenuOpen(true)}
      />

      {/* Mobile More Menu Drawer */}
      <MoreMenuModal
        isOpen={isMoreMenuOpen}
        onClose={() => setIsMoreMenuOpen(false)}
        onNavigate={navigateTo}
        currentRoute={currentRoute}
      />
    </div>
  );
}
