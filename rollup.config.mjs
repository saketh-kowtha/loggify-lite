import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from "rollup-plugin-terser";
import dts from "rollup-plugin-dts";

const config = [
    {
        input: 'src/index.ts',
        output: [
            {
                file: 'dist/index.js',
                format: 'esm',
            },

        ],
        plugins: [
            nodeResolve(),
            commonjs(),
            terser(),
            typescript({
                tsconfig: './tsconfig.json',
                outputToFilesystem: true
            }),
        ],
    },
    // TypeScript Definitions
    {
        input: "src/index.ts",
        output: { file: "dist/index.d.ts", format: "esm" },
        plugins: [dts()],
    },
];

export default config;
