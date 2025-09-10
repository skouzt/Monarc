import React, { useState, useRef, useEffect } from 'react';
import Header from './Header';
import BrowserContent from './BrowserContent';

interface Tab {
  id: number;
  url: string;
  title: string;
}

const initialBookmarks = [
  { name: 'YouTube', url: 'https://youtube.com', icon: '▶️' },
  { name: 'GitHub', url: 'https://github.com', icon: '💻' },
  { name: 'Reddit', url: 'https://reddit.com', icon: '👽' },
  { name: 'Wikipedia', url: 'https://wikipedia.org', icon: '📚' },
];

const BrowserShell: React.FC = () => {
  const [currentUrl, setCurrentUrl] = useState('monarc://newtab');
  const [isLoading, setIsLoading] = useState(false);
  const [tabs, setTabs] = useState<Tab[]>([{ id: 1, url: 'monarc://newtab', title: 'New Tab' }]);
  const [currentTabId, setCurrentTabId] = useState(1);
  const webviewRef = useRef<any>(null);

  // Debug: Check if we're in Electron
  useEffect(() => {
    const isElectron = !!(window && window.process && window.process.type);
    console.log('Running in Electron:', isElectron);
    console.log('User Agent:', navigator.userAgent);
    
    // Check if webview is supported
    const webviewSupported = 'webview' in window.document.createElement('div');
    console.log('Webview supported:', webviewSupported);
  }, []);

  const handleUrlChange = (url: string) => {
    console.log('URL change requested:', url);
    setCurrentUrl(url);
    
    // For Electron webview, we need to use loadURL method
    if (webviewRef.current && url !== 'monarc://newtab') {
      try {
        webviewRef.current.loadURL(url);
        console.log('LoadURL called successfully');
      } catch (error) {
        console.error('Error loading URL:', error);
      }
    }
  };

  const onTabUpdate = (url: string, title: string) => {
    setTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.id === currentTabId ? { ...tab, url, title } : tab
      )
    );
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      width: '100vw', 
      background: '#1c1c1c',
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    }}>
      {/* Top Header */}
      <div style={{ flexShrink: 0 }}>
        <Header
          currentUrl={currentUrl}
          setCurrentUrl={handleUrlChange}
          isLoading={isLoading}
        />
      </div>

      {/* Main Content Area */}
      <div style={{ 
        flex: 1,
        display: 'flex',
        padding: '0 1rem 1rem 1rem',
        minHeight: 0,
        overflow: 'hidden'
      }}>
        <div style={{
          flex: 1,
          borderRadius: '0.75rem',
          overflow: 'hidden',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2), 0 10px 15px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          height: '100%',
          position: 'relative'
        }}>
          <BrowserContent
            currentUrl={currentUrl}
            isLoading={isLoading}
            bookmarks={initialBookmarks}
            onBookmarkClick={handleUrlChange}
            setIsLoading={setIsLoading}
            setCurrentUrl={setCurrentUrl}
            onTabUpdate={onTabUpdate}
            webviewRef={webviewRef}
          />
        </div>
      </div>
    </div>
  );
};

export default BrowserShell;