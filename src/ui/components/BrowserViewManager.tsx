// BrowserViewManager.tsx
import React, { useEffect, useState } from 'react';

interface BrowserViewManagerProps {
  currentUrl: string;
  onLoadingChange?: (loading: boolean) => void;
  onUrlChange?: (url: string) => void;
  onTitleChange?: (title: string) => void;
  onError?: (error: any) => void;
}

const BrowserViewManager: React.FC<BrowserViewManagerProps> = ({
  currentUrl,
  onLoadingChange,
  onUrlChange,
  onTitleChange,
  onError,
}) => {
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  useEffect(() => {
    // Load initial URL
    if (currentUrl && currentUrl !== 'monarc://newtab') {
      window.electronAPI.browserviewLoadUrl(currentUrl);
    }

    // Check navigation state periodically
    const checkNavigationState = async () => {
      try {
        const back = await window.electronAPI.browserviewCanGoBack();
        const forward = await window.electronAPI.browserviewCanGoForward();
        setCanGoBack(back);
        setCanGoForward(forward);
      } catch (error) {
        console.error('Error checking navigation state:', error);
      }
    };

    const interval = setInterval(checkNavigationState, 1000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Handle URL changes
    if (currentUrl && currentUrl !== 'monarc://newtab') {
      window.electronAPI.browserviewLoadUrl(currentUrl);
    }
  }, [currentUrl]);

  useEffect(() => {
    // Set up event listeners
    const unsubscribeLoadingStart = window.electronAPI.onBrowserviewLoadingStart(() => {
      onLoadingChange?.(true);
    });

    const unsubscribeLoadingFinish = window.electronAPI.onBrowserviewLoadingFinish(() => {
      onLoadingChange?.(false);
    });

    const unsubscribeNavigate = window.electronAPI.onBrowserviewNavigate((url: string) => {
      onUrlChange?.(url);
    });

    const unsubscribeTitleUpdated = window.electronAPI.onBrowserviewTitleUpdated((title: string) => {
      onTitleChange?.(title);
    });

    const unsubscribeLoadFailed = window.electronAPI.onBrowserviewLoadFailed((error: any) => {
      onError?.(error);
    });

    const unsubscribeDomReady = window.electronAPI.onBrowserviewDomReady(() => {
      console.log('BrowserView DOM ready');
    });

    return () => {
      unsubscribeLoadingStart();
      unsubscribeLoadingFinish();
      unsubscribeNavigate();
      unsubscribeTitleUpdated();
      unsubscribeLoadFailed();
      unsubscribeDomReady();
    };
  }, [onLoadingChange, onUrlChange, onTitleChange, onError]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: currentUrl === 'monarc://newtab' ? 'none' : 'block'
      }}
    />
  );
};

export default BrowserViewManager;