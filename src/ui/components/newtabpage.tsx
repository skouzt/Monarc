// NewTabPage.tsx
import React, { useState } from "react";

type Bookmark = {
  name: string;
  url: string;
  icon: string;
};

interface NewTabPageProps {
  bookmarks: Bookmark[];
  onBookmarkClick?: (url: string) => void;
}

const NewTabPage: React.FC<NewTabPageProps> = ({ bookmarks, onBookmarkClick }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    // Open search results (Google fallback or your own search engine)
    const queryUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    onBookmarkClick?.(queryUrl);
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "2rem",
        boxSizing: "border-box",
        background: "linear-gradient(to bottom right, #f5f7fa, #e6e9f0)"
      }}
    >
      {/* Search bar */}
      <form
        onSubmit={handleSearch}
        style={{
          width: "100%",
          maxWidth: "600px",
          marginBottom: "2rem",
          display: "flex"
        }}
      >
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search or enter address..."
          style={{
            flex: 1,
            padding: "0.75rem 1rem",
            borderRadius: "9999px",
            border: "1px solid #ccc",
            outline: "none",
            fontSize: "1rem"
          }}
        />
      </form>

      {/* Bookmarks grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
          gap: "1.5rem",
          width: "100%",
          maxWidth: "800px"
        }}
      >
        {bookmarks.map((bookmark, idx) => (
          <div
            key={idx}
            onClick={() => onBookmarkClick?.(bookmark.url)}
            style={{
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "1rem",
              background: "white",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              transition: "transform 0.2s ease"
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
            }}
          >
            <img
              src={bookmark.icon}
              alt={bookmark.name}
              style={{ width: "32px", height: "32px", marginBottom: "0.5rem" }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  "https://www.google.com/s2/favicons?domain=" +
                  new URL(bookmark.url).hostname;
              }}
            />
            <span
              style={{
                fontSize: "0.85rem",
                textAlign: "center",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "80px"
              }}
            >
              {bookmark.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewTabPage;
