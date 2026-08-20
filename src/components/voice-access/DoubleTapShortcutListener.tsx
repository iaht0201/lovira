import React, { useEffect, useRef } from 'react';
import { useVoiceAccess } from './VoiceSessionManager';
import { AccessibilitySettings } from '../../types';

export const DoubleTapShortcutListener: React.FC<{ settings: AccessibilitySettings }> = ({ settings }) => {
  const { activateSession, voiceState, deactivateSession } = useVoiceAccess();
  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    if (!settings.doubleTapShortcutEnabled) return;

    const triggerToggle = () => {
      if (voiceState === 'listening') {
        deactivateSession();
      } else {
        activateSession();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      // Ignore taps on interactive inputs or buttons
      const target = e.target as HTMLElement;
      if (target.closest('button, input, textarea, select, a, [role="button"]')) {
        return;
      }

      const now = Date.now();
      const diff = now - lastTapRef.current;
      if (diff > 0 && diff < 380) {
        // Double tap detected
        triggerToggle();
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }
    };

    const handleDblClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button, input, textarea, select, a, [role="button"]')) {
        return;
      }
      triggerToggle();
    };

    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('dblclick', handleDblClick);
    return () => {
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('dblclick', handleDblClick);
    };
  }, [settings.doubleTapShortcutEnabled, voiceState, activateSession, deactivateSession]);

  return null;
};
