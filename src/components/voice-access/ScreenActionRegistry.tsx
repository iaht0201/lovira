import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export interface ScreenAction {
  id: string;
  label: string;
  aliases?: string[];
  execute: (params?: any) => any;
  isSatisfied?: boolean;
  missingReason?: string;
  promptForMissing?: string;
  prerequisites?: {
    isSatisfied?: boolean;
    missingReason?: string;
    promptForMissing?: string;
  };
}

export interface ScreenInfo {
  screenId: string;
  title: string;
  description?: string;
  actions?: ScreenAction[];
}

export const GLOBAL_APP_ACTIONS: ScreenAction[] = [
  { id: 'navigation.home', label: 'Trang chủ', aliases: ['về trang chủ', 'home', 'trang chính'], execute: () => {} },
  { id: 'navigation.openVision', label: 'Nhìn giúp tôi', aliases: ['mở nhìn giúp tôi', 'nhìn', 'camera'], execute: () => {} },
  { id: 'navigation.openConversation', label: 'Nghe & ghi lại', aliases: ['mở nghe và ghi lại', 'ghi âm', 'nghe'], execute: () => {} },
  { id: 'navigation.openEasyRead', label: 'Làm nội dung dễ hiểu', aliases: ['mở dễ hiểu', 'easy read', 'đơn giản hóa'], execute: () => {} },
  { id: 'navigation.openDocuments', label: 'Hiểu tài liệu', aliases: ['mở tài liệu', 'đọc pdf', 'xem văn bản'], execute: () => {} },
  { id: 'navigation.openHistory', label: 'Lịch sử', aliases: ['mở lịch sử', 'nhật ký'], execute: () => {} },
  { id: 'navigation.openSettings', label: 'Cài đặt', aliases: ['mở cài đặt', 'trợ năng'], execute: () => {} },
  { id: 'navigation.openSession', label: 'Lovira Life', aliases: ['mở phiên làm việc', 'phiên đời sống'], execute: () => {} },
  { id: 'speech.stop', label: 'Dừng đọc', aliases: ['ngừng đọc', 'dừng lại', 'tắt âm'], execute: () => {} },
];

interface ScreenActionContextType {
  actions: Record<string, ScreenAction>;
  currentScreenInfo: ScreenInfo;
  setCurrentScreenInfo: (info: ScreenInfo) => void;
  registerAction: (action: ScreenAction) => () => void;
  unregisterAction: (id: string) => void;
  executeAction: (id: string, params?: any) => Promise<any>;
  getAvailableActionsForAI: () => ScreenAction[];
}

const ScreenActionContext = createContext<ScreenActionContextType | null>(null);

export const useScreenActionContext = () => {
  const ctx = useContext(ScreenActionContext);
  if (!ctx) {
    throw new Error('useScreenActionContext must be used within ScreenActionProvider');
  }
  return ctx;
};

export const ScreenActionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [actions, setActions] = useState<Record<string, ScreenAction>>({});
  const [currentScreenInfo, setCurrentScreenInfo] = useState<ScreenInfo>({
    screenId: 'dashboard',
    title: 'Trang chủ',
  });

  const registerAction = useCallback((action: ScreenAction) => {
    setActions((prev) => ({ ...prev, [action.id]: action }));
    return () => {
      setActions((prev) => {
        const next = { ...prev };
        delete next[action.id];
        return next;
      });
    };
  }, []);

  const unregisterAction = useCallback((id: string) => {
    setActions((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const executeAction = useCallback(
    async (id: string, params?: any) => {
      const target = actions[id] || GLOBAL_APP_ACTIONS.find((a) => a.id === id);
      if (target && typeof target.execute === 'function') {
        return await target.execute(params);
      }
      console.warn(`[ScreenActionRegistry] Action not found or not executable: ${id}`);
      return null;
    },
    [actions]
  );

  const getAvailableActionsForAI = useCallback((screenId?: string) => {
    const all = { ...actions };
    GLOBAL_APP_ACTIONS.forEach((act) => {
      if (!all[act.id]) {
        all[act.id] = act;
      }
    });
    return Object.values(all);
  }, [actions]);

  const value = useMemo(
    () => ({
      actions,
      currentScreenInfo,
      setCurrentScreenInfo,
      registerAction,
      unregisterAction,
      executeAction,
      getAvailableActionsForAI,
    }),
    [actions, currentScreenInfo, registerAction, unregisterAction, executeAction, getAvailableActionsForAI]
  );

  return <ScreenActionContext.Provider value={value}>{children}</ScreenActionContext.Provider>;
};
