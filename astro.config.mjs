import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  vite: {
    resolve: {
      alias: {
        '@': '/src',
        '@components': '/src/components',
        '@layouts': '/src/layouts',
        '@lib': '/src/lib',
        '@i18n': '/src/i18n',
      },
    },
  },
  integrations: [react(), tailwind()],
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh', 'es', 'ja', 'de', 'fr', 'ko', 'pt'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  output: 'static',
  site: 'https://synochain.ai',
  vite: {
    resolve: {
      alias: {
        '@': '/src',
        '@components': '/src/components',
        '@layouts': '/src/layouts',
        '@lib': '/src/lib',
        '@i18n': '/src/i18n',
      },
    },
  },
});
