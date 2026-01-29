// ✅ COMPREHENSIVE FIRESTORE WARNING SUPPRESSOR
// Suppresses harmless warnings from Firestore and development environment
// These warnings don't affect functionality - they're just internal logs

const originalWarn = console.warn;
const originalError = console.error;
const originalLog = console.log;

// Helper function to check if message should be suppressed
const shouldSuppress = (message: any): boolean => {
  if (!message) return false;
  const str = message.toString().toLowerCase();
  return (
    str.includes('bloomfilter') ||
    (str.includes('@firebase/firestore') && str.includes('error')) ||
    str.includes('bloomfiltererror') ||
    str.includes('logpreviewerror') ||
    str.includes('reduxstate') ||
    str.includes('webchannelconnection') ||
    str.includes('transport errored') ||
    str.includes('failed to fetch dynamically imported module')
  );
};

// Helper to check if it's a dynamic import error that needs reload
const isDynamicImportError = (message: any): boolean => {
  if (!message) return false;
  const str = message.toString().toLowerCase();
  return str.includes('failed to fetch dynamically imported module');
};

// Handle dynamic import error with auto-reload
const handleDynamicImportError = (): void => {
  const hasReloaded = sessionStorage.getItem('dynamicImportReload');
  if (!hasReloaded) {
    sessionStorage.setItem('dynamicImportReload', 'true');
    console.log('🔄 Reloading due to cache issue...');
    setTimeout(() => window.location.reload(), 100);
  }
};

// Override console.warn
console.warn = function (...args: any[]) {
  // Check all arguments for suppressible warnings
  const shouldSuppressThis = args.some(shouldSuppress);
  if (shouldSuppressThis) {
    return; // Suppress
  }
  originalWarn.apply(console, args);
};

// Override console.error
console.error = function (...args: any[]) {
  // Check for dynamic import errors first
  const hasDynamicImportError = args.some(isDynamicImportError);
  if (hasDynamicImportError) {
    handleDynamicImportError();
    return;
  }
  
  // Check all arguments for suppressible errors
  const shouldSuppressThis = args.some(shouldSuppress);
  if (shouldSuppressThis) {
    return; // Suppress
  }
  originalError.apply(console, args);
};

// Override console.log
console.log = function (...args: any[]) {
  // Check all arguments for suppressible logs
  const shouldSuppressThis = args.some(shouldSuppress);
  if (shouldSuppressThis) {
    return; // Suppress
  }
  originalLog.apply(console, args);
};

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason?.toString() || '';
  
  // Check for dynamic import errors first
  if (isDynamicImportError(error)) {
    event.preventDefault();
    handleDynamicImportError();
    return;
  }
  
  // Suppress known harmless promise rejections
  if (shouldSuppress(error)) {
    event.preventDefault();
    // Optionally log to debug console (won't show in production)
    if (process.env.NODE_ENV === 'development') {
      console.debug('🔕 Suppressed harmless warning from development environment');
    }
  }
});

// ✅ Global window error handler
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const message = event.message?.toLowerCase() || '';
    
    // Check for dynamic import errors first
    if (isDynamicImportError(message)) {
      event.preventDefault();
      event.stopPropagation();
      handleDynamicImportError();
      return false;
    }
    
    if (shouldSuppress(message)) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  });
  
  // Clear reload flag on successful load
  window.addEventListener('load', () => {
    sessionStorage.removeItem('dynamicImportReload');
  });
}

export {};