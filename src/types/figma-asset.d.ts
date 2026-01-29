/**
 * Type declarations for figma:asset virtual module scheme
 * This allows TypeScript to recognize imports like:
 * import image from 'figma:asset/abc123.png'
 */

declare module 'figma:asset/*' {
  const content: string;
  export default content;
}
