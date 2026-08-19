import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

export interface ActionPrerequisite {
  isSatisfied: boolean;
  missingReason?: string;
  promptForMissing?: string;
  suggestionActionId?: string;
}

export interface RegisteredAction {
  id: string;
  label: string;
  aliases?: string[];
  description?: string;
  category?: 'navigation' | 'primary-action' | 'secondary-action' | 'mode-switch' | 'read' | 'control';
  prerequisites?: ActionPrerequisite;
  handler: (parameters?: Record<string, any>) => Promise<any> | any;
}

export interface ScreenContextInfo {
  screenId: string;
  screenTitle: string;
  actions: RegisteredAction[];
  screenState: Record<string, any>;
  focusedElement?: {
    id?: string;
    tagName?: string;
    text?: string;
    ariaLabel?: string;
  };
}

export interface GlobalActionDefinition {
  id: string;
  label: string;
  aliases: string[];
  description: string;
  handler?: (params?: any) => Promise<any> | any;
}

interface ScreenActionContextValue {
  currentScreenInfo: ScreenContextInfo | null;
  registerScreen: (info: ScreenContextInfo) => void;
  unregisterScreen: (screenId: string) => void;
  updateScreenState: (screenId: string, state: Record<string, any>) => void;
  executeAction: (actionId: string, parameters?: Record<string, any>) => Promise<{ success: boolean; result?: any; error?: string }>;
  getAvailableActionsForAI: () => {
    screenId: string;
    screenTitle: string;
    screenState: Record<string, any>;
    availableActions: Array<{
      id: string;
      label: string;
      aliases?: string[];
      description?: string;
      isSatisfied: boolean;
      missingReason?: string;
      promptForMissing?: string;
      suggestionActionId?: string;
    }>;
    focusedElement?: {
      id?: string;
      text?: string;
      ariaLabel?: string;
    };
  } | null;
}

const ScreenActionContext = createContext<ScreenActionContextValue | undefined>(undefined);

export const GLOBAL_APP_ACTIONS: GlobalActionDefinition[] = [
  {
    id: 'GO_HOME',
    label: 'Về trang chủ',
    aliases: ['trang chủ', 'về trang chủ', 'về home', 'màn hình chính', 'quay về trang chủ', 'trở về trang chủ'],
    description: 'Điều hướng về màn hình Trang chủ của ứng dụng.',
  },
  {
    id: 'GO_BACK',
    label: 'Quay lại',
    aliases: ['quay lại', 'trở về', 'trang trước', 'lùi lại', 'quay lại trang trước'],
    description: 'Quay trở lại trang hoặc màn hình trước đó.',
  },
  {
    id: 'OPEN_VISION',
    label: 'Nhìn giúp tôi',
    aliases: ['mở nhìn giúp tôi', 'nhìn giúp tôi', 'vào nhìn giúp tôi', 'chức năng nhìn', 'camera', 'mở camera', 'tôi muốn dùng chức năng nhìn', 'xem giúp tôi', 'mắt thần'],
    description: 'Mở tính năng Nhìn giúp tôi (Camera & Phân tích hình ảnh).',
  },
  {
    id: 'OPEN_CONVERSATION',
    label: 'Nghe & Ghi lại',
    aliases: ['nghe và ghi lại', 'nghe & ghi lại', 'mở nghe và ghi lại', 'vào nghe thoại', 'ghi âm', 'mở ghi âm', 'chuyển giọng nói thành chữ', 'trợ lý đàm thoại', 'nghe thoại'],
    description: 'Mở tính năng Nghe & Ghi lại (nhận diện giọng nói và tóm tắt cuộc họp/hội thoại).',
  },
  {
    id: 'OPEN_EASY_READ',
    label: 'Làm nội dung dễ hiểu',
    aliases: ['làm nội dung dễ hiểu', 'mở làm nội dung dễ hiểu', 'easy read', 'mở easy read', 'làm dễ hiểu', 'đơn giản hóa', 'tóm tắt đơn giản', 'dễ hiểu'],
    description: 'Mở tính năng Làm nội dung dễ hiểu (Easy Read).',
  },
  {
    id: 'OPEN_DOCUMENTS',
    label: 'Hiểu tài liệu',
    aliases: ['hiểu tài liệu', 'mở hiểu tài liệu', 'tài liệu', 'mở tài liệu', 'đọc pdf', 'phân tích văn bản', 'tài liệu của tôi'],
    description: 'Mở tính năng Hiểu tài liệu (đọc tệp PDF, DOCX, TXT).',
  },
  {
    id: 'OPEN_HISTORY',
    label: 'Lịch sử',
    aliases: ['lịch sử', 'mở lịch sử', 'xem lịch sử', 'nhật ký hoạt động', 'lịch sử hoạt động', 'các phân tích trước'],
    description: 'Mở màn hình Lịch sử hoạt động.',
  },
  {
    id: 'OPEN_SETTINGS',
    label: 'Cài đặt',
    aliases: ['cài đặt', 'mở cài đặt', 'thiết lập', 'tùy chỉnh', 'cấu hình', 'cài đặt trợ năng'],
    description: 'Mở màn hình Cài đặt và Tùy biến trợ năng.',
  },
  {
    id: 'INCREASE_FONT',
    label: 'Phóng to chữ',
    aliases: ['phóng to chữ', 'tăng cỡ chữ', 'tăng kích thước chữ', 'chữ to hơn', 'cho chữ to lên', 'chữ bé quá', 'tăng phông chữ'],
    description: 'Tăng kích cỡ phông chữ hiển thị của ứng dụng.',
  },
  {
    id: 'DECREASE_FONT',
    label: 'Thu nhỏ chữ',
    aliases: ['thu nhỏ chữ', 'giảm cỡ chữ', 'giảm kích thước chữ', 'chữ nhỏ lại', 'chữ nhỏ hơn', 'giảm phông chữ'],
    description: 'Giảm kích cỡ phông chữ hiển thị.',
  },
  {
    id: 'ENABLE_HIGH_CONTRAST',
    label: 'Bật tương phản cao',
    aliases: ['bật tương phản cao', 'tương phản cao', 'màu sắc đậm hơn', 'đậm viền', 'dễ nhìn hơn', 'chế độ tương phản'],
    description: 'Kích hoạt chế độ giao diện màu tương phản cao (High Contrast).',
  },
  {
    id: 'DISABLE_HIGH_CONTRAST',
    label: 'Tắt tương phản cao',
    aliases: ['tắt tương phản cao', 'giao diện bình thường', 'màu bình thường'],
    description: 'Tắt chế độ tương phản cao.',
  },
  {
    id: 'ENABLE_LARGE_CONTROLS',
    label: 'Bật nút lớn',
    aliases: ['bật nút lớn', 'nút bấm to', 'vùng bấm to', 'nút to hơn'],
    description: 'Kích hoạt chế độ nút bấm trợ năng kích thước lớn (Large Controls).',
  },
  {
    id: 'DISABLE_LARGE_CONTROLS',
    label: 'Tắt nút lớn',
    aliases: ['tắt nút lớn', 'nút bấm bình thường'],
    description: 'Tắt chế độ nút lớn.',
  },
  {
    id: 'STOP_READING',
    label: 'Dừng đọc',
    aliases: ['dừng đọc', 'dừng nói', 'tắt tiếng', 'im lặng', 'dừng phát âm thanh', 'ngừng đọc'],
    description: 'Dừng ngay giọng đọc âm thanh đang phát.',
  },
  {
    id: 'READ_PAGE',
    label: 'Đọc toàn bộ trang',
    aliases: ['đọc trang này', 'đọc toàn bộ trang', 'đọc màn hình', 'đọc nội dung trang', 'đọc cho tôi'],
    description: 'Đọc to toàn bộ nội dung chính đang hiển thị trên trang hiện tại.',
  },
  {
    id: 'SPEAK_SLOWER',
    label: 'Đọc chậm lại',
    aliases: ['đọc chậm lại', 'nói chậm lại', 'chậm hơn chút'],
    description: 'Giảm tốc độ phát âm thanh.',
  },
  {
    id: 'SPEAK_FASTER',
    label: 'Đọc nhanh lên',
    aliases: ['đọc nhanh lên', 'nói nhanh hơn', 'nhanh hơn chút'],
    description: 'Tăng tốc độ phát âm thanh.',
  },
];

export interface AgentResultContext {
  type: 'vision' | 'easy-read' | 'conversation' | 'document';
  accessibleText: string;
  shortText?: string;
  sourceId?: string;
}

export const CANONICAL_ACTION_ALIASES: Record<string, string[]> = {
  'conversation.start': ['startListening', 'conversation.start'],
  'conversation.pause': ['pauseListening', 'conversation.pause'],
  'conversation.resume': ['resumeListening', 'conversation.resume'],
  'conversation.stop': ['stopListening', 'conversation.stop'],
  'conversation.summarize': ['summarize', 'conversation.summarize'],
  'conversation.extractTasks': ['extractTasks', 'conversation.extractTasks'],
  'conversation.clear': ['clear', 'conversation.clear'],
  'conversation.readSummary': ['readSummary', 'conversation.readSummary'],
  'conversation.copyTranscript': ['copyTranscript', 'conversation.copyTranscript'],
  'vision.openCamera': ['openCamera', 'vision.openCamera'],
  'vision.describeScene': ['setModeScene', 'vision.describeScene'],
  'vision.readText': ['setModeText', 'vision.readText'],
  'vision.detectSafety': ['detectSafety', 'vision.detectSafety'],
  'vision.analyze': ['reanalyze', 'vision.analyze'],
  'vision.readResult': ['readSummary', 'vision.readResult'],
  'vision.reset': ['resetImage', 'vision.reset'],
  'easyRead.simplify': ['simplify', 'easyRead.simplify'],
  'easyRead.readResult': ['readResult', 'easyRead.readResult'],
  'easyRead.copyResult': ['copyResult', 'easyRead.copyResult'],
  'easyRead.clear': ['clear', 'easyRead.clear'],
  'document.readAnalysis': ['readAnalysis', 'document.readAnalysis'],
  'document.copyAnalysis': ['copyAnalysis', 'document.copyAnalysis'],
  'document.askQuestion': ['askQuestion', 'document.askQuestion'],
  'document.clear': ['clear', 'document.clear'],
};

let globalActiveScreenId: string | null = null;
const screenListeners = new Set<(screenId: string) => void>();

export function notifyScreenRegistered(screenId: string) {
  globalActiveScreenId = screenId;
  screenListeners.forEach((listener) => {
    try {
      listener(screenId);
    } catch (e) {
      console.error('[ScreenActionRegistry] listener error:', e);
    }
  });
}

export function waitForScreen(targetScreenId: string, timeoutMs: number = 4000): Promise<boolean> {
  const normTarget = targetScreenId.toLowerCase().replace('/', '');
  if (globalActiveScreenId && globalActiveScreenId.toLowerCase().replace('/', '') === normTarget) {
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    let timer: any = null;
    const listener = (screenId: string) => {
      if (screenId.toLowerCase().replace('/', '') === normTarget) {
        clearTimeout(timer);
        screenListeners.delete(listener);
        resolve(true);
      }
    };
    screenListeners.add(listener);
    timer = setTimeout(() => {
      screenListeners.delete(listener);
      resolve(false);
    }, timeoutMs);
  });
}

export const ScreenActionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentScreenInfo, setCurrentScreenInfo] = useState<ScreenContextInfo | null>(null);
  const registeredScreensRef = useRef<Map<string, ScreenContextInfo>>(new Map());

  const registerScreen = useCallback((info: ScreenContextInfo) => {
    registeredScreensRef.current.set(info.screenId, info);
    notifyScreenRegistered(info.screenId);
    setCurrentScreenInfo((prev) => {
      if (
        prev &&
        prev.screenId === info.screenId &&
        prev.screenTitle === info.screenTitle &&
        JSON.stringify(prev.screenState) === JSON.stringify(info.screenState) &&
        prev.actions.length === info.actions.length &&
        prev.actions.every((a, idx) => a.id === info.actions[idx]?.id)
      ) {
        return prev;
      }
      return info;
    });
  }, []);

  const unregisterScreen = useCallback((screenId: string) => {
    registeredScreensRef.current.delete(screenId);
    if (globalActiveScreenId === screenId) {
      globalActiveScreenId = null;
    }
    setCurrentScreenInfo((prev) => (prev?.screenId === screenId ? null : prev));
  }, []);

  const updateScreenState = useCallback((screenId: string, state: Record<string, any>) => {
    const existing = registeredScreensRef.current.get(screenId);
    if (existing) {
      const updated: ScreenContextInfo = {
        ...existing,
        screenState: { ...existing.screenState, ...state },
      };
      registeredScreensRef.current.set(screenId, updated);
      setCurrentScreenInfo((prev) => (prev?.screenId === screenId ? updated : prev));
    }
  }, []);

  const getFocusedElementInfo = () => {
    if (typeof document === 'undefined') return undefined;
    const el = document.activeElement as HTMLElement;
    if (!el || el === document.body) return undefined;
    return {
      id: el.id || undefined,
      tagName: el.tagName.toLowerCase(),
      text: el.innerText ? el.innerText.slice(0, 100).trim() : undefined,
      ariaLabel: el.getAttribute('aria-label') || undefined,
    };
  };

  const getAvailableActionsForAI = useCallback(() => {
    if (!currentScreenInfo) return null;
    const focused = getFocusedElementInfo();
    return {
      screenId: currentScreenInfo.screenId,
      screenTitle: currentScreenInfo.screenTitle,
      screenState: currentScreenInfo.screenState,
      focusedElement: focused,
      availableActions: currentScreenInfo.actions.map((act) => ({
        id: act.id,
        label: act.label,
        aliases: act.aliases,
        description: act.description,
        isSatisfied: act.prerequisites ? act.prerequisites.isSatisfied : true,
        missingReason: act.prerequisites?.missingReason,
        promptForMissing: act.prerequisites?.promptForMissing,
        suggestionActionId: act.prerequisites?.suggestionActionId,
      })),
    };
  }, [currentScreenInfo]);

  const executeAction = useCallback(
    async (actionId: string, parameters?: Record<string, any>) => {
      if (!currentScreenInfo) {
        return { success: false, error: 'Không tìm thấy màn hình hiện tại.' };
      }

      const normId = actionId.toLowerCase();
      // Match exact ID or canonical alias match
      const targetAction = currentScreenInfo.actions.find((a) => {
        const aNorm = a.id.toLowerCase();
        if (aNorm === normId) return true;
        // Check alias mapping
        for (const [canonical, aliases] of Object.entries(CANONICAL_ACTION_ALIASES)) {
          const cNorm = canonical.toLowerCase();
          const aliasNorms = aliases.map((al) => al.toLowerCase());
          if (
            (cNorm === normId || aliasNorms.includes(normId)) &&
            (cNorm === aNorm || aliasNorms.includes(aNorm))
          ) {
            return true;
          }
        }
        return false;
      });

      if (!targetAction) {
        return { success: false, error: `Hành động "${actionId}" không tồn tại trên màn hình này.` };
      }

      if (targetAction.prerequisites && !targetAction.prerequisites.isSatisfied) {
        return {
          success: false,
          error: targetAction.prerequisites.missingReason || 'Chưa đủ điều kiện để thực hiện hành động này.',
        };
      }

      try {
        const result = await targetAction.handler(parameters);
        return { success: true, result };
      } catch (err: any) {
        console.error(`[ScreenActionRegistry] Error executing action ${actionId}:`, err);
        return { success: false, error: err?.message || 'Có sự cố khi thực hiện hành động.' };
      }
    },
    [currentScreenInfo]
  );

  return (
    <ScreenActionContext.Provider
      value={{
        currentScreenInfo,
        registerScreen,
        unregisterScreen,
        updateScreenState,
        executeAction,
        getAvailableActionsForAI,
      }}
    >
      {children}
    </ScreenActionContext.Provider>
  );
};

export const useScreenActionContext = () => {
  const context = useContext(ScreenActionContext);
  if (!context) {
    throw new Error('useScreenActionContext must be used within a ScreenActionProvider');
  }
  return context;
};

export interface UseRegisterScreenActionsConfig {
  screenId: string;
  screenTitle: string;
  actions: RegisteredAction[];
  screenState?: Record<string, any>;
}

/**
 * Hook for individual screen components to register their available actions and state
 */
export function useRegisterScreenActions(
  configOrScreenId: UseRegisterScreenActionsConfig | string,
  screenTitle?: string,
  actions?: RegisteredAction[],
  screenState: Record<string, any> = {}
) {
  const { registerScreen, unregisterScreen } = useScreenActionContext();

  const resolvedConfig = typeof configOrScreenId === 'string'
    ? { screenId: configOrScreenId, screenTitle: screenTitle || '', actions: actions || [], screenState }
    : configOrScreenId;

  const { screenId, screenTitle: title, actions: actList, screenState: state = {} } = resolvedConfig;

  // Use refs to store the latest action list and state to avoid recreating the effect
  const latestActionsRef = useRef<RegisteredAction[]>(actList);
  const latestStateRef = useRef<Record<string, any>>(state);

  // Keep refs in sync with the latest values on every render
  useEffect(() => {
    latestActionsRef.current = actList;
    latestStateRef.current = state;
  });

  // Structural representation of the actions to use in dependency array
  const actionStructureStr = JSON.stringify(
    actList.map((a) => ({
      id: a.id,
      label: a.label,
      aliases: a.aliases,
      description: a.description,
      isSatisfied: a.prerequisites?.isSatisfied,
    }))
  );

  const stateStr = JSON.stringify(state);

  useEffect(() => {
    // Create proxy actions that always look up and call the latest handler from ref
    const proxyActions = latestActionsRef.current.map((act) => ({
      ...act,
      handler: async (parameters?: Record<string, any>) => {
        const currentAct = latestActionsRef.current.find((a) => a.id === act.id);
        if (currentAct) {
          return currentAct.handler(parameters);
        }
        return act.handler(parameters);
      },
    }));

    registerScreen({
      screenId,
      screenTitle: title,
      actions: proxyActions,
      screenState: latestStateRef.current,
    });

    return () => {
      unregisterScreen(screenId);
    };
  }, [screenId, title, actionStructureStr, stateStr, registerScreen, unregisterScreen]);
}
