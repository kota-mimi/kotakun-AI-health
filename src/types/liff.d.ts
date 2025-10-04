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
      shareTargetPicker: (messages: unknown[]) => Promise<void>;
    };
  }
}

export {};