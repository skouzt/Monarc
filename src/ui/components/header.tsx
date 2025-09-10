'use client';

import React, { useEffect, useState } from 'react';
import SearchBar from './SearchBar';
import type { ElectronAPI } from '../../../types';

interface HeaderProps {
  currentUrl: string;
  setCurrentUrl: (url: string) => void;
  isLoading?: boolean;
  canGoBack?: boolean;
  canGoForward?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  currentUrl,
  setCurrentUrl,
  isLoading,
  canGoBack = false,
  canGoForward = false,
}) => {
  const [electronAPI, setElectronAPI] = useState<ElectronAPI | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setElectronAPI(window.electronAPI);
      
      // Listen for window state changes
      const handleMaximize = () => setIsMaximized(true);
      const handleUnmaximize = () => setIsMaximized(false);
      
      window.electronAPI?.onMaximize?.(handleMaximize);
      window.electronAPI?.onUnmaximize?.(handleUnmaximize);
      
      // Check initial state
      window.electronAPI?.isMaximized?.().then(setIsMaximized);
      
      return () => {
        window.electronAPI?.removeMaximizeListener?.(handleMaximize);
        window.electronAPI?.removeUnmaximizeListener?.(handleUnmaximize);
      };
    }
  }, []);

  const handleTrafficLightClick = (action: 'close' | 'minimize' | 'maximize') => {
    if (!electronAPI) return;
    
    switch (action) {
      case 'close':
        electronAPI.close();
        break;
      case 'minimize':
        electronAPI.minimize();
        break;
      case 'maximize':
        if (isMaximized) {
          electronAPI.unmaximize?.();
        } else {
          electronAPI.maximize();
        }
        break;
    }
  };

  const handleSubmit = (url: string) => {
    setCurrentUrl(url);
  };

  // Only show traffic lights on macOS
  const showTrafficLights = process.platform === 'darwin';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: '3rem',
        padding: '0 1rem',
        backgroundColor: 'rgba(28, 28, 28, 0.8)',
        backdropFilter: 'blur(10px)',
        userSelect: 'none',
        WebkitAppRegion: 'drag',
        gap: '1rem',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Left traffic lights for macOS */}
      {showTrafficLights && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            WebkitAppRegion: 'no-drag'
          }}
        >
          <button 
            onClick={() => handleTrafficLightClick('close')}
            style={{
              padding: '4px',
              borderRadius: '50%',
              transition: 'background-color 0.2s ease',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 95, 86, 0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            aria-label="Close window"
          >
            <img src="/ui/asset/red.svg" alt="Close" width={14} height={14} draggable={false} />
          </button>
          <button 
            onClick={() => handleTrafficLightClick('minimize')}
            style={{
              padding: '4px',
              borderRadius: '50%',
              transition: 'background-color 0.2s ease',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 189, 46, 0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            aria-label="Minimize window"
          >
            <img src="/ui/asset/yellow.svg" alt="Minimize" width={14} height={14} draggable={false} />
          </button>
          <button 
            onClick={() => handleTrafficLightClick('maximize')}
            style={{
              padding: '4px',
              borderRadius: '50%',
              transition: 'background-color 0.2s ease',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(39, 201, 63, 0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            aria-label={isMaximized ? 'Restore window' : 'Maximize window'}
          >
            <img 
              src="/ui/asset/green.svg" 
              alt={isMaximized ? 'Restore' : 'Maximize'} 
              width={14} 
              height={14} 
              draggable={false} 
            />
          </button>
        </div>
      )}

      {/* Center search bar */}
      <div style={{
        flex: 1,
        maxWidth: '24rem',
        WebkitAppRegion: 'no-drag'
      }}>
        <SearchBar
          currentUrl={currentUrl}
          setCurrentUrl={setCurrentUrl}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          showWindowControls={!showTrafficLights} // Show window controls in searchbar for non-macOS
        />
      </div>
      
      {/* Right spacer for balance */}
      <div style={{ 
        width: showTrafficLights ? '4rem' : '0',
        WebkitAppRegion: 'no-drag'
      }} />
    </div>
  );
};

export default Header;