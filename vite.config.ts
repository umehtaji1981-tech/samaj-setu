import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // This correctly picks up variables from Netlify's environment.
  // Fix: Using '.' instead of process.cwd() to avoid TS error "Property 'cwd' does not exist on type 'Process'"
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react()],
    define: {
      // Properly define the API key string replacement
      // Use the key from env (local .env or Netlify dashboard)
      // Fallback to empty string to prevent build-time crashes
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
              return 'vendor-react';
            }
            if (id.includes('node_modules/mammoth') || id.includes('node_modules/xlsx')) {
              return 'vendor-utils-docs';
            }
            if (id.includes('node_modules/@google/genai')) {
              return 'vendor-ai';
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
          }
        }
      }
    }
  };
});