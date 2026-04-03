// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://smiro.dev',
  integrations: [mdx(), sitemap()],
  compressHTML: true,
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'viewport',
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      cssMinify: 'lightningcss',
    },
  },
});
