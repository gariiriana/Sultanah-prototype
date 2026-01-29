import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// ✅ Plugin to handle figma:asset imports (replace with placeholder images)
function figmaAssetPlugin() {
  return {
    name: 'figma-asset-handler',
    resolveId(id: string) {
      if (id.startsWith('figma:asset/')) {
        // Return the ID to be handled in load hook
        return id;
      }
      return null;
    },
    load(id: string) {
      if (id.startsWith('figma:asset/')) {
        // Extract the hash from the import
        const hash = id.replace('figma:asset/', '').replace('.png', '');
        
        // Create inline SVG placeholders with Islamic/Mecca themes
        // These are Data URLs so they work OFFLINE and INSTANTLY!
        const inlineImages: Record<string, string> = {
          // Sultanah Logo - Turquoise Islamic pattern
          '527860b20e63dfd1b3dc5983acb6137c02aaa6ad': `data:image/svg+xml;base64,${btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#14b8a6;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#0d9488;stop-opacity:1" />
                </linearGradient>
              </defs>
              <rect width="400" height="400" fill="url(#logoGrad)"/>
              <circle cx="200" cy="150" r="60" fill="white" opacity="0.3"/>
              <circle cx="200" cy="150" r="40" fill="white" opacity="0.5"/>
              <rect x="180" y="190" width="40" height="60" fill="white" opacity="0.4"/>
              <text x="200" y="280" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="white" text-anchor="middle">SULTANAH</text>
              <text x="200" y="310" font-family="Arial, sans-serif" font-size="14" fill="white" text-anchor="middle" opacity="0.9">HAJJ - UMRAH | HOLIDAY</text>
            </svg>
          `)}`,
          
          '9ee9e221758644d2591e4ab49b751bf0f4075c4c': `data:image/svg+xml;base64,${btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
              <defs>
                <linearGradient id="logoGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#14b8a6;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#0d9488;stop-opacity:1" />
                </linearGradient>
              </defs>
              <rect width="400" height="400" fill="url(#logoGrad2)"/>
              <circle cx="200" cy="150" r="60" fill="white" opacity="0.3"/>
              <circle cx="200" cy="150" r="40" fill="white" opacity="0.5"/>
              <rect x="180" y="190" width="40" height="60" fill="white" opacity="0.4"/>
              <text x="200" y="280" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="white" text-anchor="middle">SULTANAH</text>
              <text x="200" y="310" font-family="Arial, sans-serif" font-size="14" fill="white" text-anchor="middle" opacity="0.9">HAJJ - UMRAH | HOLIDAY</text>
            </svg>
          `)}`,
          
          // Kaaba/Masjid al-Haram background - Beautiful Islamic architecture scene
          '20975334a0499df0d7013517117f8aa5a8f346ed': `data:image/svg+xml;base64,${btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
              <defs>
                <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:#1e3a8a;stop-opacity:1" />
                  <stop offset="50%" style="stop-color:#3b82f6;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#60a5fa;stop-opacity:1" />
                </linearGradient>
                <radialGradient id="moonGlow" cx="50%" cy="50%">
                  <stop offset="0%" style="stop-color:#fbbf24;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#f59e0b;stop-opacity:0.3" />
                </radialGradient>
              </defs>
              
              <!-- Sky -->
              <rect width="1920" height="1080" fill="url(#skyGrad)"/>
              
              <!-- Stars -->
              <circle cx="300" cy="150" r="2" fill="white" opacity="0.8"/>
              <circle cx="500" cy="200" r="2" fill="white" opacity="0.6"/>
              <circle cx="800" cy="100" r="2" fill="white" opacity="0.9"/>
              <circle cx="1200" cy="180" r="2" fill="white" opacity="0.7"/>
              <circle cx="1500" cy="120" r="2" fill="white" opacity="0.8"/>
              <circle cx="1700" cy="220" r="2" fill="white" opacity="0.6"/>
              
              <!-- Crescent Moon -->
              <circle cx="1600" cy="200" r="50" fill="url(#moonGlow)"/>
              <circle cx="1620" cy="200" r="45" fill="#1e3a8a"/>
              
              <!-- Ground/Plaza -->
              <ellipse cx="960" cy="900" rx="900" ry="180" fill="#d4d4d4" opacity="0.3"/>
              
              <!-- Kaaba (center) -->
              <rect x="860" y="450" width="200" height="250" fill="#1a1a1a"/>
              <rect x="870" y="460" width="180" height="20" fill="#d4af37" opacity="0.8"/>
              
              <!-- Minarets (towers) -->
              <rect x="400" y="300" width="60" height="400" fill="#f5f5f5" opacity="0.9"/>
              <rect x="410" y="280" width="40" height="30" fill="#d4af37"/>
              <circle cx="430" cy="265" r="15" fill="#d4af37"/>
              
              <rect x="1460" y="300" width="60" height="400" fill="#f5f5f5" opacity="0.9"/>
              <rect x="1470" y="280" width="40" height="30" fill="#d4af37"/>
              <circle cx="1490" cy="265" r="15" fill="#d4af37"/>
              
              <!-- Arches -->
              <path d="M 600 500 Q 700 400 800 500" fill="none" stroke="#d4af37" stroke-width="4"/>
              <path d="M 1120 500 Q 1220 400 1320 500" fill="none" stroke="#d4af37" stroke-width="4"/>
              
              <!-- Decorative patterns -->
              <circle cx="960" cy="200" r="3" fill="#d4af37" opacity="0.6"/>
              <circle cx="1000" cy="250" r="3" fill="#d4af37" opacity="0.6"/>
              <circle cx="920" cy="250" r="3" fill="#d4af37" opacity="0.6"/>
            </svg>
          `)}`,
          
          // Jamaah hero image - Pilgrimage scene
          '679778c08c2456a4c7d2207a690cd0c5b45f0fc0': `data:image/svg+xml;base64,${btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
              <defs>
                <linearGradient id="pilgrimSky" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:#0369a1;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#0891b2;stop-opacity:1" />
                </linearGradient>
              </defs>
              
              <!-- Background sky -->
              <rect width="1920" height="1080" fill="url(#pilgrimSky)"/>
              
              <!-- Sun rays -->
              <circle cx="1600" cy="200" r="80" fill="#fbbf24" opacity="0.4"/>
              <circle cx="1600" cy="200" r="60" fill="#fbbf24" opacity="0.6"/>
              <circle cx="1600" cy="200" r="40" fill="#f59e0b" opacity="0.9"/>
              
              <!-- Ground -->
              <ellipse cx="960" cy="900" rx="960" ry="200" fill="#d4d4d4" opacity="0.4"/>
              
              <!-- Islamic architecture silhouette -->
              <rect x="200" y="400" width="400" height="300" fill="#1e40af" opacity="0.7"/>
              <circle cx="400" cy="380" r="50" fill="#1e40af" opacity="0.7"/>
              
              <rect x="1320" y="400" width="400" height="300" fill="#1e40af" opacity="0.7"/>
              <circle cx="1520" cy="380" r="50" fill="#1e40af" opacity="0.7"/>
              
              <!-- Center dome -->
              <rect x="760" y="500" width="400" height="200" fill="#374151" opacity="0.8"/>
              <ellipse cx="960" cy="500" rx="200" ry="80" fill="#d4af37" opacity="0.7"/>
              
              <!-- Decorative elements -->
              <text x="960" y="950" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle" opacity="0.3">SULTANAH TRAVEL</text>
            </svg>
          `)}`,
        };
        
        // Return the inline image (works offline!)
        const imageUrl = inlineImages[hash] || `data:image/svg+xml;base64,${btoa(`
          <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
            <rect width="800" height="600" fill="#14b8a6"/>
            <text x="400" y="300" font-family="Arial" font-size="32" fill="white" text-anchor="middle">SULTANAH</text>
          </svg>
        `)}`;
        
        // Return ES module that exports the image URL
        return `export default "${imageUrl}";`;
      }
      return null;
    }
  };
}

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    figmaAssetPlugin(), // ✅ Add figma asset handler
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
    target: 'esnext',
    minify: 'esbuild',
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
    force: true,
  },
  server: {
    fs: {
      strict: false,
    },
  },
})