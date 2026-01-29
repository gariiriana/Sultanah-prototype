/**
 * Global type declarations for Sultanah Travel project
 * 
 * This file provides TypeScript support for custom module schemes
 * used in the project (like figma:asset virtual modules)
 */

/// <reference types="vite/client" />

/**
 * Figma Asset Virtual Module Support
 * 
 * Allows importing images using the figma:asset scheme:
 * @example
 * import logo from 'figma:asset/527860b20e63dfd1b3dc5983acb6137c02aaa6ad.png';
 * 
 * The Vite plugin in vite.config.ts intercepts these imports
 * and returns inline SVG Data URLs
 */
declare module 'figma:asset/*' {
  /**
   * Image source as Data URL (inline SVG)
   * Can be used directly in img src or CSS background-image
   */
  const content: string;
  export default content;
}

/**
 * SVG imports (for imported Figma vectors)
 */
declare module '*.svg' {
  const content: string;
  export default content;
}

/**
 * Image imports
 */
declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}
