// BrowserContent.tsx
import React, { useState } from "react";
import BrowserViewManager from "./BrowserViewManager";
import NewTabPage from "./newtabpage"; 

type Bookmark = {
  name: string;
  url: string;
  icon: string;
};

interface BrowserContentProps {
  currentUrl: string;
  isLoading: boolean;
  bookmarks: Bookmark[];
  onBookmarkClick?: (url: string) => void;
  setIsLoading?: (loading: boolean) => void;
  setCurrentUrl?: (url: string) => void;
  onTabUpdate?: (url: string, title: string) => void;
}

const BrowserContent: React.FC<BrowserContentProps> = ({
  currentUrl,
  isLoading,
  bookmarks,
  onBookmarkClick,
  setIsLoading,
  setCurrentUrl,
  onTabUpdate,
}) => {
  

  const handleLoadingChange = (loading: boolean) => {
    setIsLoading?.(loading);
  };

  const handleUrlChange = (url: string) => {
    setCurrentUrl?.(url);
    onTabUpdate?.(url, url.split("/")[2] || "Loading...");
  };

  const handleTitleChange = (title: string) => {
    onTabUpdate?.(currentUrl, title);
  };

  const isNewTab = currentUrl === "monarc://newtab";

  return (
    <div style={{ 
      width: '100%', 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      {isNewTab ? (
        <NewTabPage
          bookmarks={bookmarks}
          onBookmarkClick={onBookmarkClick}
        />
      ) : (
        <BrowserViewManager
          currentUrl={currentUrl}
          onLoadingChange={handleLoadingChange}
          onUrlChange={handleUrlChange}
          onTitleChange={handleTitleChange}
        />
      )}
      
      {/* Loading overlay */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.1)',
          zIndex: 10
        }}>
          <div style={{
            padding: '1rem 2rem',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            borderRadius: '8px',
            fontSize: '1rem'
          }}>
            Loading...
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowserContent;