import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
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
});
