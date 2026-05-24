import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: 'https://sentezhane.com',
  output: 'static',
  trailingSlash: 'always',
  compressHTML: true,

  i18n: {
    defaultLocale: 'tr',
    locales: ['tr', 'en'],
    routing: { prefixDefaultLocale: false },
  },

  build: {
    inlineStylesheets: 'auto',
  },

  vite: {
    build: {
      minify: 'esbuild',
      cssMinify: 'esbuild',
      target: 'es2020',
    },
    esbuild: {
      legalComments: 'none',
    },
  },

  integrations: [
    sitemap({
      i18n: { defaultLocale: 'tr', locales: { tr: 'tr-TR', en: 'en-US' } },
    }),
  ],

  adapter: cloudflare()
});