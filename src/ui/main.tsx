import React from 'react';
import ReactDOM from 'react-dom/client';
import BrowserShell from './components/BrowserShell';
import './index.css'; // Your main CSS file

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  
  <React.StrictMode>
    
    <BrowserShell />
  </React.StrictMode>
);