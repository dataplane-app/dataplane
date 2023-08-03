import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const WRONG_CODE = `import { bpfrpt_proptype_WindowScroller } from "../WindowScroller.js";`;

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
                const file = path.resolve(path.dirname(config.configFile), 'node_modules/react-lazylog/node_modules/react-virtualized/dist/es/WindowScroller/utils/onScroll.js');
                const code = fs.readFileSync(file, 'utf-8');
                const modified = code.replace(WRONG_CODE, '');
                fs.writeFileSync(file, modified);
            },
        },
    ],
    define: {
        'process.env': {},
    },
    server: {
        port: 3000,
        host: true,
    },
    build: {
        outDir: './build',
    },
});
