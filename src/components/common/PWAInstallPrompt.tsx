import React, { useState, useEffect } from 'react';
import { Smartphone, Download, Share2, X, AlertTriangle } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'other'>('other');
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    // 1. Detect if already in standalone mode
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      console.log('[PWA] App is running in standalone mode.');
      return;
    }

    // 2. Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isSafariBrowser = /safari/.test(userAgent) && !/crios|fxios|chrome|opera|edge/.test(userAgent);

    if (isIOS) {
      setPlatform('ios');
      setIsSafari(isSafariBrowser);
    } else {
      setPlatform('android'); // Android or other Chromium desktop/mobile
    }

    // 3. Check dismiss cool-down in localStorage (7 days)
    const dismissedAt = localStorage.getItem('pwa-install-dismissed-at');
    if (dismissedAt) {
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      if (elapsed < sevenDaysMs) {
        console.log('[PWA] PWA install dismissed in last 7 days. Hiding prompt.');
        return;
      }
    }

    // 4. Listen for Chromium installation prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log('[PWA] beforeinstallprompt event fired');
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Handle iOS display logic (show prompt if on iOS and not in standalone)
    if (isIOS) {
      // iOS doesn't have beforeinstallprompt, so we display the instructions modal directly
      // but only if Safari is used, or a friendly notice to use Safari if on iOS other browsers.
      setIsVisible(true);
    }

    // 6. Handle appinstalled event
    const handleAppInstalled = () => {
      console.log('[PWA] App successfully installed!');
      setIsVisible(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleDismiss = () => {
    // Save dismissal timestamp to avoid bothering users for 7 days
    localStorage.setItem('pwa-install-dismissed-at', Date.now().toString());
    setIsVisible(false);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Trigger native Chromium install dialogue
    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    console.log(`[PWA] User choice: ${choiceResult.outcome}`);

    if (choiceResult.outcome === 'accepted') {
      console.log('[PWA] User accepted the installation.');
      setIsVisible(false);
    } else {
      console.log('[PWA] User dismissed the installation.');
    }
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed bottom-16 sm:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md bg-surface border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-5 transition-all animate-fade-in duration-300"
      id="pwa-install-container"
    >
      <button 
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1.5 rounded-full text-text-secondary hover:bg-surface-subtle"
        aria-label="Đóng bảng tin cài đặt"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-4">
        <div className="p-3 bg-primary-soft rounded-xl text-primary shrink-0">
          <Smartphone className="w-6 h-6" />
        </div>

        <div className="space-y-1 pr-6">
          <h4 className="text-sm font-bold text-text-primary">
            Cài đặt ứng dụng Lovira
          </h4>
          <p className="text-xs text-text-secondary leading-relaxed">
            Thêm Lovira vào màn hình chính để truy cập nhanh hơn và sử dụng độc lập, mượt mà không có thanh địa chỉ trình duyệt.
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        {platform === 'ios' ? (
          <div className="space-y-3">
            {isSafari ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-text-primary space-y-2">
                <p className="font-semibold flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                  <Share2 className="w-4 h-4" /> Hướng dẫn cài đặt trên iPhone:
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-text-secondary">
                  <li>Bấm nút <strong>Chia sẻ (Share)</strong> ở thanh dưới của Safari.</li>
                  <li>Cuộn xuống và chọn <strong>"Thêm vào Màn hình chính"</strong>.</li>
                  <li>Bấm <strong>Thêm</strong> ở góc trên bên phải để hoàn tất.</li>
                </ol>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-text-primary space-y-1.5">
                <p className="font-semibold flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
                  <AlertTriangle className="w-4 h-4" /> Vui lòng mở bằng Safari:
                </p>
                <p className="text-text-secondary">
                  Trình duyệt này không hỗ trợ cài đặt PWA trực tiếp. Hãy sao chép liên kết này và mở bằng trình duyệt <strong>Safari</strong> để tiến hành thêm vào màn hình chính.
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleDismiss}
                className="px-4 py-2 text-xs font-bold rounded-xl text-text-secondary hover:bg-surface-subtle transition-colors"
              >
                Để sau
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleDismiss}
              className="px-4 py-2 text-xs font-bold rounded-xl text-text-secondary hover:bg-surface-subtle transition-colors"
            >
              Để sau
            </button>
            
            <button
              type="button"
              onClick={handleInstallClick}
              disabled={!deferredPrompt}
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Cài đặt</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
