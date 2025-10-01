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
      sendMessages: (messages: any[]) => Promise<void>;
      shareTargetPicker: (messages: any[]) => Promise<void>;
    };
  }
}

export {};