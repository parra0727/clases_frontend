import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const devProxyTarget = String(env.VITE_DEV_PROXY_TARGET ?? 'http://localhost:8080').trim();

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: devProxyTarget,
          changeOrigin: true,
          configure: (proxy) => {
            // Elimina Origin y Referer antes de llegar a Spring Security.
            // Sin Origin, el CORS filter no se activa y no hay 403.
            // Necesario porque el browser envía Origin incluso en peticiones
            // same-origin cuando credentials:'same-origin' está activo.
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.removeHeader('origin');
              proxyReq.removeHeader('referer');
            });
          },
        },
      },
    },
  };
});
