import {defineConfig} from 'astro/config';
import react from '@astrojs/react';
import worker from "@astropub/worker"
import sitemap from '@astrojs/sitemap';
import wasm from "vite-plugin-wasm";

// https://astro.build/config
export default defineConfig({
    integrations: [react(), sitemap(), worker(),],
    vite: {
        plugins: [wasm()]
    }
});
