import ts from '@rollup/plugin-typescript';
import { dts } from 'rollup-plugin-dts';
import tsConfig from './tsconfig.json' with { type: 'json' };

export default [
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      sourcemap: true,
    },
    plugins: [ts()],
    external: ['react', 'react/jsx-runtime', 'keck', 'keck/react', 'lodash-es'],
  },
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
    },
    plugins: [
      dts({
        compilerOptions: { paths: tsConfig.compilerOptions.paths },
      }),
    ],
    external: ['react', 'react/jsx-runtime', 'keck', 'keck/react', 'lodash-es'],
  },
];
