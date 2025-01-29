import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

const config = [
    {
        input: 'src/index.ts',
        output: [
            {
                file: 'dist/index.js',
                format: 'cjs',
            },
            {
                file: 'dist/index.esm.js',
                format: 'es',
            },
        ],
        plugins: [
            nodeResolve(),
            commonjs(),
            typescript({
                tsconfig: './tsconfig.json',
            }),
        ],
    },

];

export default config;
