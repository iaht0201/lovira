import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Pause, Play } from 'lucide-react';
import { speakText, stopSpeaking, isSpeechSynthesisSupported, isUserInteracted } from '../../lib/speech';

interface ReadAloudButtonProps {
  text: string;
  speechRate?: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ReadAloudButton: React.FC<ReadAloudButtonProps> = ({
  text,
  speechRate = 1.0,
  label = 'Đọc thành tiếng',
  size = 'md',
  className = '',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    setIsSupported(isSpeechSynthesisSupported());
  }, []);

  if (!isSupported) {
    return null;
  }

  const handleToggle = () => {
    if (!text || !text.trim()) return;

    if (isPlaying) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
    } else {
      if (!isUserInteracted()) {
        console.log('Interaction detected for speech trigger');
      }
      setIsPlaying(true);
      setIsPaused(false);

      const success = speakText(text, {
        rate: speechRate,
        onEnd: () => {
          setIsPlaying(false);
          setIsPaused(false);
        },
        onError: () => {
          setIsPlaying(false);
          setIsPaused(false);
        },
      });

      if (!success) {
        setIsPlaying(false);
      }
    }
  };

  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    stopSpeaking();
    setIsPlaying(false);
    setIsPaused(false);
  };

  const paddingClass =
    size === 'sm' ? 'px-2.5 py-1.5 text-xs' : size === 'lg' ? 'px-5 py-3 text-base' : 'px-3.5 py-2 text-sm';

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label={isPlaying ? (isPaused ? 'Tiếp tục đọc' : 'Tạm dừng đọc') : label}
        className={`inline-flex items-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 ${
          isPlaying
            ? 'bg-indigo-700 text-white hover:bg-indigo-800'
            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60 border border-indigo-200/60 dark:border-indigo-800/60'
        } ${paddingClass}`}
      >
        {isPlaying ? (
          isPaused ? (
            <Play className="w-4 h-4 shrink-0" aria-hidden="true" />
          ) : (
            <Pause className="w-4 h-4 shrink-0" aria-hidden="true" />
          )
        ) : (
          <Volume2 className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
        )}
        <span>{isPlaying ? (isPaused ? 'Tiếp tục' : 'Tạm dừng') : label}</span>
      </button>

      {isPlaying && (
        <button
          type="button"
          onClick={handleStop}
          aria-label="Dừng đọc"
          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <VolumeX className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};
