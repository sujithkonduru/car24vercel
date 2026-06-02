import { defineConfig} from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/bookingApi': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/cars': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
            if (req.headers['x-branch-id']) {
              proxyReq.setHeader('X-Branch-Id', req.headers['x-branch-id']);
            }
            if (req.headers['x-branch-head-id']) {
              proxyReq.setHeader('X-Branch-Head-Id', req.headers['x-branch-head-id']);
            }
          });
        }
      },
      '/cars/images': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
          });
        }
      },
      '/user': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
          });
        }
      },
      '/roleauth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
            if (req.headers['x-branch-id']) {
              proxyReq.setHeader('X-Branch-Id', req.headers['x-branch-id']);
            }
            if (req.headers['x-branch-head-id']) {
              proxyReq.setHeader('X-Branch-Head-Id', req.headers['x-branch-head-id']);
            }
          });
        }
      },
      // Use regex to match /branch/* API routes ONLY (not frontend routes like /branch_dashboard)
      '^/branch/': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
            if (req.headers['x-branch-id']) {
              proxyReq.setHeader('X-Branch-Id', req.headers['x-branch-id']);
            }
            if (req.headers['x-branch-head-id']) {
              proxyReq.setHeader('X-Branch-Head-Id', req.headers['x-branch-head-id']);
            }
          });
        }
      },
      // ⭐ ADD THESE MISSING PROXY ROUTES ⭐
      // '/branch_dashboard': {
      //   target: 'http://localhost:3000',
      //   changeOrigin: true,
      //   configure: (proxy, _options) => {
      //     proxy.on('proxyReq', (proxyReq, req, _res) => {
      //       if (req.headers.authorization) {
      //         proxyReq.setHeader('Authorization', req.headers.authorization);
      //       }
      //     });
      //   }
      // },
      // '/branch_cars': {
      //   target: 'http://localhost:3000',
      //   changeOrigin: true,
      //   configure: (proxy, _options) => {
      //     proxy.on('proxyReq', (proxyReq, req, _res) => {
      //       if (req.headers.authorization) {
      //         proxyReq.setHeader('Authorization', req.headers.authorization);
      //       }
      //     });
      //   }
      // },
      // '/update-booking-status': {
      //   target: 'http://localhost:3000',
      //   changeOrigin: true,
      //   configure: (proxy, _options) => {
      //     proxy.on('proxyReq', (proxyReq, req, _res) => {
      //       if (req.headers.authorization) {
      //         proxyReq.setHeader('Authorization', req.headers.authorization);
      //       }
      //     });
      //   }
      // },
      // '/verify-booking-start': {
      //   target: 'http://localhost:3000',
      //   changeOrigin: true,
      //   configure: (proxy, _options) => {
      //     proxy.on('proxyReq', (proxyReq, req, _res) => {
      //       if (req.headers.authorization) {
      //         proxyReq.setHeader('Authorization', req.headers.authorization);
      //       }
      //     });
      //   }
      // },
      // '/verify-booking-end': {
      //   target: 'http://localhost:3000',
      //   changeOrigin: true,
      //   configure: (proxy, _options) => {
      //     proxy.on('proxyReq', (proxyReq, req, _res) => {
      //       if (req.headers.authorization) {
      //         proxyReq.setHeader('Authorization', req.headers.authorization);
      //       }
      //     });
      //   }
      // },
      '/photoUpload': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
            if (req.headers['x-branch-id']) {
              proxyReq.setHeader('X-Branch-Id', req.headers['x-branch-id']);
            }
            if (req.headers['x-branch-head-id']) {
              proxyReq.setHeader('X-Branch-Head-Id', req.headers['x-branch-head-id']);
            }
          });
        }
      }
    }
  },
});