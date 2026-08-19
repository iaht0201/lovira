import React, { useEffect, useRef } from 'react';
import { useVoiceAccess } from './VoiceSessionManager';
import { AccessibilitySettings } from '../../types';

interface ShortcutProps {
  settings: AccessibilitySettings;
}

export const DoubleTapShortcutListener: React.FC<ShortcutProps> = ({ settings }) => {
  const { activateSession } = useVoiceAccess();
  const lastTapRef = useRef<number>(0);
  const activateSessionRef = useRef(activateSession);

  useEffect(() => {
    activateSessionRef.current = activateSession;
  }, [activateSession]);

  useEffect(() => {
    if (!settings.doubleTapShortcutEnabled || !settings.voiceAccessEnabled) return;

    const handleDoubleTap = (e: TouchEvent) => {
      // Avoid firing if tapping on interactive elements like buttons, inputs, selects, links
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a')
      ) {
        return;
      }

      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300;
      if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
        console.log('[PWA Voice] Double tap gesture detected. Launching active voice session.');
        e.preventDefault();
        activateSessionRef.current();
      }
      lastTapRef.current = now;
    };

    const handleDoubleClick = (e: MouseEvent) => {
      // Desktop fallback double click
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a')
      ) {
        return;
      }

      console.log('[PWA Voice] Double click gesture detected. Launching active voice session.');
      activateSessionRef.current();
    };

    window.addEventListener('touchend', handleDoubleTap, { passive: false });
    window.addEventListener('dblclick', handleDoubleClick);

    return () => {
      window.removeEventListener('touchend', handleDoubleTap);
      window.removeEventListener('dblclick', handleDoubleClick);
    };
  }, [settings.doubleTapShortcutEnabled, settings.voiceAccessEnabled]);

  return null;
};
