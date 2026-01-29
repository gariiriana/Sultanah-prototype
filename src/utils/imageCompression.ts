/**
 * Image Compression Utilities for Sultanah Travel
 * 
 * Firestore has a 1MB document size limit.
 * This utility compresses base64 images to stay under limits.
 * 
 * Target: Each image max 200-300KB after compression
 */

// ========================================
// LEGACY EXPORTS FOR BACKWARD COMPATIBILITY
// ========================================

/**
 * Compress a File object to base64 (for backward compatibility)
 * @param file - File object to compress
 * @param maxWidth - Maximum width in pixels (default: 800)
 * @param quality - JPEG quality 0-1 (default: 0.7)
 * @returns Promise<string> - Compressed base64 string
 */
export const compressImage = async (file: File, maxWidth: number = 800, quality: number = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions - more aggressive resize
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with compression - start with higher quality
        let currentQuality = quality;
        let base64 = canvas.toDataURL('image/jpeg', currentQuality);
        
        // Iteratively reduce quality if file is still too large for Firestore
        // Firestore has 1MB document limit, base64 is ~33% larger than binary
        // So we target max 700KB base64 to be safe
        const maxBase64Size = 700 * 1024; // 700KB in bytes
        let attempts = 0;
        
        while (base64.length > maxBase64Size && currentQuality > 0.3 && attempts < 5) {
          currentQuality -= 0.1;
          base64 = canvas.toDataURL('image/jpeg', currentQuality);
          attempts++;
        }
        
        resolve(base64);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Validate image file (for backward compatibility)
 * @param file - File object to validate
 * @returns boolean - True if valid
 */
export const validateImageFile = (file: File): boolean => {
  const imageMaxSize = 3 * 1024 * 1024; // 3MB for images (will be compressed)
  
  const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (!supportedTypes.includes(file.type)) {
    throw new Error('Tipe file tidak didukung. Silakan upload JPG, PNG, atau WebP');
  }
  
  if (file.size > imageMaxSize) {
    throw new Error(`Ukuran gambar terlalu besar. Maksimal ${(imageMaxSize / 1024 / 1024).toFixed(0)}MB`);
  }
  
  return true;
};

// ========================================
// NEW BASE64 STRING COMPRESSION FUNCTIONS
// ========================================

/**
 * Compress a base64 image to reduce file size
 * @param base64String - The base64 string (with or without data:image prefix)
 * @param maxWidth - Maximum width in pixels (default: 1200)
 * @param maxHeight - Maximum height in pixels (default: 1200)
 * @param quality - JPEG quality 0-1 (default: 0.7)
 * @returns Promise<string> - Compressed base64 string
 */
export const compressBase64Image = async (
  base64String: string,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Create image element
      const img = new Image();
      
      img.onload = () => {
        try {
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth || height > maxHeight) {
            const aspectRatio = width / height;
            
            if (width > height) {
              width = maxWidth;
              height = width / aspectRatio;
            } else {
              height = maxHeight;
              width = height * aspectRatio;
            }
          }
          
          // Create canvas
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          // Draw image to canvas
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to compressed base64 (JPEG for better compression)
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          
          resolve(compressedBase64);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      // Set image source
      img.src = base64String;
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Compress multiple images in parallel
 * @param images - Object with image keys and base64 values
 * @returns Promise<Record<string, string>> - Compressed images
 */
export const compressMultipleImages = async (
  images: Record<string, string | null>
): Promise<Record<string, string>> => {
  const compressionPromises = Object.entries(images).map(async ([key, value]) => {
    if (!value) return [key, ''];
    
    try {
      const compressed = await compressBase64Image(value);
      return [key, compressed];
    } catch (error) {
      console.error(`Failed to compress ${key}:`, error);
      return [key, value]; // Return original if compression fails
    }
  });
  
  const results = await Promise.all(compressionPromises);
  return Object.fromEntries(results.filter(([_, value]) => value));
};

/**
 * Get the size of a base64 string in bytes
 * @param base64String - The base64 string
 * @returns number - Size in bytes
 */
export const getBase64Size = (base64String: string): number => {
  // Remove data URL prefix if present
  const base64Data = base64String.includes(',') 
    ? base64String.split(',')[1] 
    : base64String;
  
  // Calculate size in bytes
  const padding = base64Data.endsWith('==') ? 2 : base64Data.endsWith('=') ? 1 : 0;
  return (base64Data.length * 3) / 4 - padding;
};

/**
 * Format bytes to human readable string
 * @param bytes - Size in bytes
 * @returns string - Formatted size (e.g., "1.2 MB")
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Validate if base64 image is under size limit
 * @param base64String - The base64 string
 * @param maxSizeBytes - Maximum size in bytes (default: 300KB)
 * @returns boolean - True if under limit
 */
export const isBase64UnderLimit = (base64String: string, maxSizeBytes: number = 300 * 1024): boolean => {
  return getBase64Size(base64String) <= maxSizeBytes;
};

/**
 * Aggressively compress until under target size
 * @param base64String - The base64 string
 * @param targetSizeBytes - Target size in bytes (default: 250KB)
 * @returns Promise<string> - Compressed base64 string
 */
export const compressToTargetSize = async (
  base64String: string,
  targetSizeBytes: number = 250 * 1024
): Promise<string> => {
  let compressed = base64String;
  let quality = 0.7;
  let maxWidth = 1200;
  
  // Try multiple compression levels
  while (getBase64Size(compressed) > targetSizeBytes && quality > 0.1) {
    compressed = await compressBase64Image(base64String, maxWidth, maxWidth, quality);
    
    // Reduce quality or dimensions
    if (getBase64Size(compressed) > targetSizeBytes) {
      quality -= 0.1;
      
      if (quality <= 0.3 && maxWidth > 800) {
        maxWidth -= 200;
        quality = 0.7; // Reset quality when reducing dimensions
      }
    }
  }
  
  return compressed;
};

/**
 * Calculate total size of all images in an object
 * @param images - Object with image keys and base64 values
 * @returns number - Total size in bytes
 */
export const calculateTotalImageSize = (images: Record<string, string | null>): number => {
  return Object.values(images).reduce((total, value) => {
    if (!value) return total;
    return total + getBase64Size(value);
  }, 0);
};