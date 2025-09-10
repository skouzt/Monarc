import React, { useState, useEffect, useCallback } from "react";

interface SearchBarProps {
  currentUrl: string;
  setCurrentUrl?: (url: string) => void;
  onSubmit?: (url: string) => void;
  isLoading?: boolean;
  canGoBack?: boolean;
  canGoForward?: boolean;
    showWindowControls?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  currentUrl,
  setCurrentUrl,
  onSubmit,
  isLoading = false,
  canGoBack = false,
  canGoForward = false,
}) => {
  const [inputValue, setInputValue] = useState(currentUrl);
  const [navigationState, setNavigationState] = useState({
    canGoBack,
    canGoForward,
  });

  // Update input value when currentUrl changes
  useEffect(() => {
    if (currentUrl !== inputValue && currentUrl !== "monarc://newtab") {
      setInputValue(currentUrl);
    }
  }, [currentUrl]);

  // Update navigation state when props change
  useEffect(() => {
    setNavigationState({ canGoBack, canGoForward });
  }, [canGoBack, canGoForward]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    let url = inputValue.trim();

    // Handle empty input
    if (!url) {
      setCurrentUrl?.("monarc://newtab");
      onSubmit?.("monarc://newtab");
      return;
    }

    // Handle special protocols and about: pages
    if (url.startsWith("monarc://") || url.startsWith("about:")) {
      setCurrentUrl?.(url);
      onSubmit?.(url);
      return;
    }

    // If the input is a valid URL, navigate to it
    try {
      // Test if it's a valid URL
      new URL(url);
      // If it doesn't have a protocol, add https://
      if (!url.includes("://")) {
        url = `https://${url}`;
      }
    } catch {
      // If it's not a valid URL, perform a Google search
      url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
    }

    setCurrentUrl?.(url);
    onSubmit?.(url);
  }, [inputValue, setCurrentUrl, onSubmit]);

  const handleGoBack = useCallback(async () => {
    if (navigationState.canGoBack) {
      try {
        await window.electronAPI.browserviewGoBack();
      } catch (error) {
        console.error('Failed to go back:', error);
      }
    }
  }, [navigationState.canGoBack]);

  const handleGoForward = useCallback(async () => {
    if (navigationState.canGoForward) {
      try {
        await window.electronAPI.browserviewGoForward();
      } catch (error) {
        console.error('Failed to go forward:', error);
      }
    }
  }, [navigationState.canGoForward]);

  const handleReload = useCallback(async () => {
    try {
      await window.electronAPI.browserviewReload();
    } catch (error) {
      console.error('Failed to reload:', error);
    }
  }, []);

  const handleStop = useCallback(async () => {
    try {
      await window.electronAPI.browserviewStop();
    } catch (error) {
      console.error('Failed to stop:', error);
    }
  }, []);

  const handleHomeClick = useCallback(() => {
    setCurrentUrl?.("monarc://newtab");
    onSubmit?.("monarc://newtab");
  }, [setCurrentUrl, onSubmit]);

  const dot = 14;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        gap: '0.5rem',
        WebkitAppRegion: 'no-drag',
      }}
    >
      {/* Traffic Lights for macOS */}
      {process.platform === 'darwin' && (
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginRight: '0.75rem',
            WebkitAppRegion: 'no-drag',
          }}
        >
          <button
            onClick={() => window.electronAPI.close()}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#ff5f56',
              border: 'none',
              cursor: 'pointer',
              transition: 'filter 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(0.8)'}
            onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
            title="Close"
          />
          <button
            onClick={() => window.electronAPI.minimize()}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#ffbd2e',
              border: 'none',
              cursor: 'pointer',
              transition: 'filter 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(0.8)'}
            onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
            title="Minimize"
          />
          <button
            onClick={() => window.electronAPI.maximize()}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#27c93f',
              border: 'none',
              cursor: 'pointer',
              transition: 'filter 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(0.8)'}
            onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
            title="Maximize"
          />
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'rgba(55, 53, 53, 0.8)',
          backdropFilter: 'blur(8px)',
          borderRadius: '1rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          padding: '0.25rem 0.75rem',
          columnGap: '0.5rem',
          WebkitAppRegion: 'no-drag',
          minWidth: 0, // Allows flex item to shrink properly
        }}
      >
        {/* Navigation Buttons */}
        <button
          type="button"
          onClick={handleGoBack}
          disabled={!navigationState.canGoBack}
          style={{
            padding: '0.25rem',
            backgroundColor: 'transparent',
            borderRadius: '0.5rem',
            transition: 'background-color 150ms',
            opacity: navigationState.canGoBack ? 1 : 0.4,
            cursor: navigationState.canGoBack ? 'pointer' : 'not-allowed',
          }}
          onMouseEnter={(e) => {
            if (navigationState.canGoBack) {
              e.currentTarget.style.backgroundColor = 'rgba(64, 64, 64, 0.5)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="Go Back"
        >
          <img
            src="/ui/asset/left.svg"
            alt="Back"
            style={{ width: `${dot}px`, height: `${dot}px` }}
            draggable={false}
          />
        </button>

        <button
          type="button"
          onClick={handleGoForward}
          disabled={!navigationState.canGoForward}
          style={{
            padding: '0.25rem',
            backgroundColor: 'transparent',
            borderRadius: '0.5rem',
            transition: 'background-color 150ms',
            opacity: navigationState.canGoForward ? 1 : 0.4,
            cursor: navigationState.canGoForward ? 'pointer' : 'not-allowed',
          }}
          onMouseEnter={(e) => {
            if (navigationState.canGoForward) {
              e.currentTarget.style.backgroundColor = 'rgba(64, 64, 64, 0.5)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="Go Forward"
        >
          <img
            src="/ui/asset/right.svg"
            alt="Forward"
            style={{ width: `${dot}px`, height: `${dot}px` }}
            draggable={false}
          />
        </button>

        {isLoading ? (
          <button
            type="button"
            onClick={handleStop}
            style={{
              padding: '0.25rem',
              backgroundColor: 'transparent',
              borderRadius: '0.5rem',
              transition: 'background-color 150ms',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(64, 64, 64, 0.5)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Stop Loading"
          >
            <img
              src="/ui/asset/stop.svg"
              alt="Stop"
              style={{ width: `${dot}px`, height: `${dot}px` }}
              draggable={false}
            />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleReload}
            style={{
              padding: '0.25rem',
              backgroundColor: 'transparent',
              borderRadius: '0.5rem',
              transition: 'background-color 150ms',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(64, 64, 64, 0.5)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Reload"
          >
            <img
              src="/ui/asset/reload.svg"
              alt="Reload"
              style={{ width: `${dot}px`, height: `${dot}px` }}
              draggable={false}
            />
          </button>
        )}

        {/* Search / URL input */}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            fontSize: '0.875rem',
            color: 'rgb(229, 231, 235)',
            outline: 'none',
            padding: '0.25rem 0.5rem',
            border: 'none',
            minWidth: 0, // Allows input to shrink properly
            '::placeholder': {
              color: 'rgb(156, 163, 175)',
            },
          }}
          placeholder="Search or enter URL"
        />

        {/* Castle / Home button */}
        <button
          type="button"
          onClick={handleHomeClick}
          style={{
            padding: '0.25rem',
            backgroundColor: 'transparent',
            borderRadius: '0.5rem',
            transition: 'background-color 150ms',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(64, 64, 64, 0.5)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          title="Home"
        >
          <img
            src="/ui/asset/castle.svg"
            alt="Home"
            style={{ width: '1.25rem', height: '1.25rem' }}
            draggable={false}
          />
        </button>
      </form>

      {/* Windows/Linux window controls */}
      {process.platform !== 'darwin' && (
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginLeft: '0.75rem',
            WebkitAppRegion: 'no-drag',
          }}
        >
          <button
            onClick={() => window.electronAPI.minimize()}
            style={{
              padding: '0.25rem',
              backgroundColor: 'transparent',
              borderRadius: '0.25rem',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(64, 64, 64, 0.5)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Minimize"
          >
            <img
              src="/ui/asset/minimize.svg"
              alt="Minimize"
              style={{ width: '12px', height: '12px' }}
              draggable={false}
            />
          </button>
          <button
            onClick={() => window.electronAPI.maximize()}
            style={{
              padding: '0.25rem',
              backgroundColor: 'transparent',
              borderRadius: '0.25rem',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(64, 64, 64, 0.5)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Maximize"
          >
            <img
              src="/ui/asset/maximize.svg"
              alt="Maximize"
              style={{ width: '12px', height: '12px' }}
              draggable={false}
            />
          </button>
          <button
            onClick={() => window.electronAPI.close()}
            style={{
              padding: '0.25rem',
              backgroundColor: 'transparent',
              borderRadius: '0.25rem',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 59, 48, 0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Close"
          >
            <img
              src="/ui/asset/close.svg"
              alt="Close"
              style={{ width: '12px', height: '12px' }}
              draggable={false}
            />
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchBar;