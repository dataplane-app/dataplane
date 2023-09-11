import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
// import monacoEditorPlugin from 'vite-plugin-monaco-editor';

export default defineConfig({
    esbuild: {
        loader: 'jsx',
    },
    optimizeDeps: {
        esbuildOptions: {
            loader: {
                '.js': 'jsx',
            },
        },
    },
    plugins: [
        react(),
        {
            name: 'my:react-virtualized',
            configResolved(config) {
                const WRONG_CODE = `import { bpfrpt_proptype_WindowScroller } from "../WindowScroller.js";`;
                const nodepath = "node_modules/react-virtualized/dist/es/WindowScroller/utils/onScroll.js"
                // const nodepath = "node_modules/react-virtualized/dist/es/WindowScroller/WindowScroller.js"
                                 
                // 'node_modules/react-lazylog/node_modules/react-virtualized/dist/es/WindowScroller/utils/onScroll.js'
                const file = path.resolve(path.dirname(config.configFile), nodepath);
                if(fs.existsSync(file) === true) {
                    console.log('Removing wrong code from react-virtualized')
                    const code = fs.readFileSync(file, 'utf-8');
                    const modified = code.replace(WRONG_CODE, '');
                    fs.writeFileSync(file, modified);
                }
            },
        },
        // monacoEditorPlugin.default({
        //     languageWorkers: ['json', 'python', 'shell'],
        // }),
    ],
    envDir: './src/enviroment',
    // define: {
    //     'process.env': {},
    // },
    server: {
        port: 3000,
        host: true,
    },
    build: {
        outDir: '../app/mainapp/frontbuild',
    },
    base: '/webapp/',
});
