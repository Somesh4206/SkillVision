import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';

// Canonical public origin. Override per environment with APP_URL (Render env var).
const DEFAULT_SITE_URL = 'https://skillvisionai-ck9m.onrender.com';
const SITE_URL_TOKEN = /__SITE_URL__|https:\/\/skillvisionai\.onrender\.com/g;
const SEO_FILES = ['robots.txt', 'sitemap.xml'];

function resolveSiteUrl(): string {
  const raw = (process.env.APP_URL || '').trim() || DEFAULT_SITE_URL;
  return raw.replace(/\/+$/, '');
}

function applySiteUrl(content: string, siteUrl: string): string {
  return content.replace(SITE_URL_TOKEN, siteUrl);
}

function seoSitePlugin(): Plugin {
  let siteUrl = resolveSiteUrl();
  let outDir = path.resolve(process.cwd(), 'dist');

  return {
    name: 'skillvision-seo-site-url',
    apply: 'build',
    configResolved(config) {
      siteUrl = resolveSiteUrl();
      outDir = path.resolve(config.root, config.build.outDir);
    },
    // Rewrites canonical/og/twitter/JSON-LD URLs in index.html
    transformIndexHtml(html) {
      return applySiteUrl(html, siteUrl);
    },
    // Vite copies public/ verbatim, so rewrite the emitted files afterwards
    writeBundle() {
      for (const file of SEO_FILES) {
        const target = path.join(outDir, file);
        if (fs.existsSync(target)) {
          fs.writeFileSync(target, applySiteUrl(fs.readFileSync(target, 'utf-8'), siteUrl), 'utf-8');
        }
      }
    }
  };
}

// Serves robots.txt/sitemap.xml with the site URL applied during `npm run dev`
function seoDevPlugin(): Plugin {
  return {
    name: 'skillvision-seo-site-url-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url || '').split('?')[0];
        const file = SEO_FILES.find((name) => `/${name}` === pathname);
        if (!file) return next();
        const target = path.resolve(server.config.root, 'public', file);
        if (!fs.existsSync(target)) return next();
        res.setHeader('Content-Type', file.endsWith('.xml') ? 'application/xml' : 'text/plain; charset=utf-8');
        res.end(applySiteUrl(fs.readFileSync(target, 'utf-8'), resolveSiteUrl()));
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), seoSitePlugin(), seoDevPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    publicDir: 'public', // Ensures robots.txt, sitemap.xml are copied to dist
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
