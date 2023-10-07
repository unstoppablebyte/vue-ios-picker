import {resolve} from 'path'
import {defineConfig} from 'vite'
import vue from "@vitejs/plugin-vue";

export default defineConfig({
    plugins: [vue()],
    build: {
        lib: {
            // Could also be a dictionary or array of multiple entry points
            entry: resolve(__dirname, 'src/index.js'),
            name: 'IosPicker',
            // the proper extensions will be added
            fileName: 'ios-picker',
            formats: ['es', 'cjs', 'umd'], // Include 'umd' format
        },
        rollupOptions: {
            // make sure to externalize deps that shouldn't be bundled
            // into your library
            external: ['vue'],
            output: {
                format: ['cjs', 'es', 'umd'], // Include 'umd' format
                // Provide global variables to use in the UMD build
                // for externalized deps
                globals: {
                    vue: 'Vue',
                },
            },
        },
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        }
    }
})