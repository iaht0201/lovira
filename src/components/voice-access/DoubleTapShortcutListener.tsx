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
      const rawTarget = e.target as (Node | null);
      const target = (rawTarget instanceof Element ? rawTarget : rawTarget?.parentElement) as HTMLElement | null;
      if (!target) return;

      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'A' ||
        (typeof target.closest === 'function' && (target.closest('button') || target.closest('a')))
      ) {
        return;
      }

      const now = Date.now();
      const DOUBLE_TAP_DELAY = 350;
      if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
        console.log('[PWA Voice] Double tap gesture detected. Launching active voice session.');
        activateSessionRef.current();
      }
      lastTapRef.current = now;
    };

    const handleDoubleClick = (e: MouseEvent) => {
      // Desktop fallback double click
      const rawTarget = e.target as (Node | null);
      const target = (rawTarget instanceof Element ? rawTarget : rawTarget?.parentElement) as HTMLElement | null;
      if (!target) return;

      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'A' ||
        (typeof target.closest === 'function' && (target.closest('button') || target.closest('a')))
      ) {
        return;
      }

      console.log('[PWA Voice] Double click gesture detected. Launching active voice session.');
      activateSessionRef.current();
    };

    window.addEventListener('touchend', handleDoubleTap, { passive: true });
    window.addEventListener('dblclick', handleDoubleClick);

    return () => {
      window.removeEventListener('touchend', handleDoubleTap);
      window.removeEventListener('dblclick', handleDoubleClick);
    };
  }, [settings.doubleTapShortcutEnabled, settings.voiceAccessEnabled]);

  return null;
};
