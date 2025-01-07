import {defineConfig} from 'astro/config';
import react from '@astrojs/react';
import worker from "@astropub/worker"
import sitemap from '@astrojs/sitemap';
import wasm from "vite-plugin-wasm";
import { builtinModules } from 'module';

const allExternal = [
    ...builtinModules,
    ...builtinModules.map((m) => `node:${m}`)
]

// add the following to your config object

// https://astro.build/config
export default defineConfig({
    output: 'static',
    integrations: [react(

    ), worker(

    ),],
    vite: {
        plugins: [wasm()],
        build: {
            rollupOptions: {
                external: ['fsevents', ...allExternal]
            }
        }
    }
});
