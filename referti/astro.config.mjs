import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'hybrid',
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  integrations: [svelte()],
  site: 'https://referti.bio-clinic.it',
  vite: {
    resolve: {
      alias: {
        '$lib': '/src/lib',
        '$stores': '/src/stores',
        '$components': '/src/app/components',
      },
    },
  },
});
