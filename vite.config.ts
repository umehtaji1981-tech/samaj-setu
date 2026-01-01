import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Properly define the API key string replacement
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },
    build: {
      // Increase the limit slightly to 1000kb as community apps often need heavy utility libs
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // Manual chunking to separate large libraries
          manualChunks(id) {
            // Group React core together
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
              return 'vendor-react';
            }
            // Group heavy document processing libraries (mammoth, xlsx)
            if (id.includes('node_modules/mammoth') || id.includes('node_modules/xlsx')) {
              return 'vendor-utils-docs';
            }
            // Group the Gemini AI SDK
            if (id.includes('node_modules/@google/genai')) {
              return 'vendor-ai';
            }
            // Group icons
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
          }
        }
      }
    }
  };
});