declare global {
  interface Window {
    liff: {
      init: (config: { liffId: string }) => Promise<void>;
      isLoggedIn: () => boolean;
      getProfile: () => Promise<{
        userId: string;
        displayName: string;
        pictureUrl?: string;
        statusMessage?: string;
      }>;
      login: () => void;
      logout: () => void;
      openWindow: (params: {
        url: string;
        external?: boolean;
      }) => void;
      closeWindow: () => void;
      sendMessages: (messages: unknown[]) => Promise<void>;
      shareTargetPicker: (messages: {
        type: 'image';
        originalContentUrl: string;
        previewImageUrl: string;
      }[]) => Promise<void>;
    };
  }
  
  interface Navigator {
    canShare?: (data?: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  }
  
  interface ShareData {
    title?: string;
    text?: string;
    url?: string;
    files?: File[];
  }
}

export {};