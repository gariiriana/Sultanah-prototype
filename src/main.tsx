import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import { displaySeedInstructions } from './utils/seedAdminAccount';

// ✅ Suppress console errors BEFORE anything else loads
if (typeof window !== 'undefined') {
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;
  
  console.error = (...args: any[]) => {
    const str = JSON.stringify(args).toLowerCase();
    if (str.includes('logpreviewerror') || str.includes('reduxstate') || str.includes('failed to fetch dynamically imported module')) return;
    originalError.apply(console, args);
  };
  
  console.warn = (...args: any[]) => {
    const str = JSON.stringify(args).toLowerCase();
    if (str.includes('logpreviewerror') || str.includes('reduxstate')) return;
    originalWarn.apply(console, args);
  };
  
  console.log = (...args: any[]) => {
    const str = JSON.stringify(args).toLowerCase();
    if (str.includes('logpreviewerror') || str.includes('reduxstate')) return;
    originalLog.apply(console, args);
  };
  
  // ✅ Global error handler to suppress window-level errors and handle dynamic import failures
  window.addEventListener('error', (event) => {
    const message = event.message?.toLowerCase() || '';
    if (message.includes('logpreviewerror') || 
        message.includes('reduxstate') ||
        message.includes('failed to fetch dynamically imported module')) {
      event.preventDefault();
      event.stopPropagation();
      
      // If it's a dynamic import error, reload the page once
      if (message.includes('failed to fetch dynamically imported module')) {
        const hasReloaded = sessionStorage.getItem('dynamicImportReload');
        if (!hasReloaded) {
          sessionStorage.setItem('dynamicImportReload', 'true');
          console.log('🔄 Reloading due to cache issue...');
          window.location.reload();
        }
      }
      return false;
    }
  });
  
  // ✅ Unhandled promise rejection handler with dynamic import retry
  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.toString().toLowerCase() || '';
    if (message.includes('logpreviewerror') || 
        message.includes('reduxstate') ||
        message.includes('failed to fetch dynamically imported module')) {
      event.preventDefault();
      event.stopPropagation();
      
      // If it's a dynamic import error, reload the page once
      if (message.includes('failed to fetch dynamically imported module')) {
        const hasReloaded = sessionStorage.getItem('dynamicImportReload');
        if (!hasReloaded) {
          sessionStorage.setItem('dynamicImportReload', 'true');
          console.log('🔄 Reloading due to cache issue...');
          window.location.reload();
        }
      }
      return false;
    }
  });
  
  // ✅ Clear the reload flag after successful load
  window.addEventListener('load', () => {
    sessionStorage.removeItem('dynamicImportReload');
  });
  
  // ✅ Display seed instructions on app load
  displaySeedInstructions();
}

// ✅ Dynamic import with retry logic
const loadApp = async (retries = 3) => {
  try {
    const { default: App } = await import('./app/App');
    return App;
  } catch (error) {
    if (retries > 0) {
      console.log(`⚠️ Failed to load App, retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return loadApp(retries - 1);
    }
    throw error;
  }
};

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

// ✅ Load and render with error handling
loadApp()
  .then(App => {
    createRoot(root).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  })
  .catch(error => {
    console.error('Failed to load application:', error);
    root.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; font-family: system-ui, -apple-system, sans-serif;">
        <div style="max-width: 500px; text-align: center;">
          <h1 style="font-size: 24px; margin-bottom: 16px; color: #dc2626;">⚠️ Failed to Load Application</h1>
          <p style="margin-bottom: 24px; color: #6b7280;">There was an error loading the application. This is usually caused by browser cache issues.</p>
          <button 
            onclick="location.reload()" 
            style="background: #3b82f6; color: white; padding: 12px 24px; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; font-weight: 600;"
          >
            🔄 Reload Page
          </button>
        </div>
      </div>
    `;
  });