// File compression utilities for Base64 storage (Images, PDF, Word, Excel)

// Supported file types
export const SUPPORTED_FILE_TYPES = {
  images: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  pdf: ['application/pdf'],
  word: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  excel: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
};

export const ALL_SUPPORTED_TYPES = [
  ...SUPPORTED_FILE_TYPES.images,
  ...SUPPORTED_FILE_TYPES.pdf,
  ...SUPPORTED_FILE_TYPES.word,
  ...SUPPORTED_FILE_TYPES.excel,
];

// Get file extension from filename
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

// Get file type category
export const getFileTypeCategory = (file: File): 'image' | 'pdf' | 'word' | 'excel' | 'unknown' => {
  if (SUPPORTED_FILE_TYPES.images.includes(file.type)) return 'image';
  if (SUPPORTED_FILE_TYPES.pdf.includes(file.type)) return 'pdf';
  if (SUPPORTED_FILE_TYPES.word.includes(file.type)) return 'word';
  if (SUPPORTED_FILE_TYPES.excel.includes(file.type)) return 'excel';
  return 'unknown';
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

// Compress image files
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

// Convert any file to base64
export const fileToBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      resolve(reader.result as string);
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

// Validate and process file (compress images, convert others to base64)
export const processFile = async (file: File): Promise<{ base64: string; fileName: string; fileSize: number; fileType: string }> => {
  validateFile(file);
  
  const fileType = getFileTypeCategory(file);
  let base64: string;
  
  // Compress images, convert others directly
  if (fileType === 'image') {
    base64 = await compressImage(file);
  } else {
    // For non-image files, check if they will exceed Firestore limit
    // Base64 encoding increases size by ~33%
    const estimatedBase64Size = file.size * 1.33;
    const maxFirestoreSize = 700 * 1024; // 700KB to be safe (Firestore limit is 1MB)
    
    if (estimatedBase64Size > maxFirestoreSize) {
      throw new Error(`File terlalu besar untuk disimpan. Maksimal ${Math.round(maxFirestoreSize / 1.33 / 1024)}KB untuk PDF/Word/Excel. Silakan gunakan file yang lebih kecil atau compress terlebih dahulu.`);
    }
    
    base64 = await fileToBase64(file);
  }
  
  // Final safety check: validate base64 size
  const base64SizeInBytes = base64.length;
  const maxBase64Size = 700 * 1024; // 700KB
  
  if (base64SizeInBytes > maxBase64Size) {
    throw new Error(`File hasil kompresi terlalu besar (${formatFileSize(base64SizeInBytes)}). Firestore limit 1MB. Silakan gunakan gambar dengan resolusi lebih kecil atau file yang lebih ringkas.`);
  }
  
  return {
    base64,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
  };
};

// Validate file type and size
export const validateFile = (file: File): boolean => {
  // Stricter limits to ensure Base64 encoding stays under Firestore 1MB limit
  const imageMaxSize = 3 * 1024 * 1024; // 3MB for images (will be compressed)
  const documentMaxSize = 500 * 1024; // 500KB for PDF/Word/Excel (Base64 will be ~650KB)
  
  if (!ALL_SUPPORTED_TYPES.includes(file.type)) {
    throw new Error('Tipe file tidak didukung. Silakan upload JPG, PNG, PDF, Word, atau Excel');
  }
  
  const fileType = getFileTypeCategory(file);
  
  if (fileType === 'image' && file.size > imageMaxSize) {
    throw new Error(`Ukuran gambar terlalu besar. Maksimal ${formatFileSize(imageMaxSize)}`);
  }
  
  if (fileType !== 'image' && file.size > documentMaxSize) {
    throw new Error(`Ukuran file terlalu besar. Maksimal ${formatFileSize(documentMaxSize)} untuk PDF/Word/Excel`);
  }
  
  return true;
};

// Legacy function for backward compatibility
export const validateImageFile = validateFile;