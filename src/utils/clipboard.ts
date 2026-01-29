/**
 * Safe clipboard utility with fallback for browsers that block Clipboard API
 * Handles NotAllowedError and provides alternative copy method
 */

/**
 * Copy text to clipboard with fallback
 * @param text - Text to copy
 * @returns Promise<boolean> - True if successful, false otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Method 1: Try modern Clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error: any) {
      // If Clipboard API fails (NotAllowedError, etc.), silently try fallback
      // This is normal in some browsers/contexts, not an error
    }
  }

  // Method 2: Fallback - Create temporary textarea
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    
    // Make it invisible and off-screen
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    textarea.style.top = '-999999px';
    textarea.style.opacity = '0';
    textarea.setAttribute('readonly', '');
    
    document.body.appendChild(textarea);
    
    // For iOS Safari
    textarea.contentEditable = 'true';
    textarea.readOnly = false;
    
    // Select the text
    if (navigator.userAgent.match(/ipad|iphone/i)) {
      // iOS specific selection
      const range = document.createRange();
      range.selectNodeContents(textarea);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      textarea.setSelectionRange(0, 999999);
    } else {
      textarea.select();
    }
    
    // Copy the text
    const successful = document.execCommand('copy');
    
    // Clean up
    document.body.removeChild(textarea);
    
    return successful;
  } catch (error) {
    console.error('Fallback clipboard method failed:', error);
    return false;
  }
}

/**
 * Check if clipboard is available
 * @returns boolean
 */
export function isClipboardAvailable(): boolean {
  return !!(navigator.clipboard && navigator.clipboard.writeText);
}