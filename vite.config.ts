import { resolve } from 'path';
import { defineConfig } from 'vite';
import makeManifest from './scripts/make-manifest';

const srcDir = resolve(__dirname, 'src');
const outDir = resolve(__dirname, 'dist');
const publicDir = resolve(__dirname, 'public');

export default defineConfig({
    resolve: {
        alias: {
            '@': srcDir
        }
    },
    plugins: [makeManifest()],
    publicDir,
    build: {
        outDir,
        rollupOptions: {
            input: {
                background: resolve(srcDir, 'background', 'index.ts'),
                content: resolve(srcDir, 'content', 'index.ts'),
                contentStyle: resolve(srcDir, 'content', 'index.less'),
                popup: resolve(srcDir, 'popup', 'index.html')
            },
            output: {
                entryFileNames: 'src/[name]/index.js',
                assetFileNames: 'src/content/[name].[ext]'
            },
            watch: {
                include: ['src/**', 'scripts/**', 'public/**', 'vite.config.ts'],
                exclude: ['public/manifest.json']
            }
        }
    }
});
