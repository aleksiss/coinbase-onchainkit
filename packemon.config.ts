import type { ConfigFile } from 'packemon';

const config: ConfigFile = {
  babelInput(config) {
    config.plugins?.push([
      require.resolve('babel-plugin-module-resolver'),
      {
        root: './',
        alias: {
          '@/': './src',
        },
      },
    ]);
  },
};

export default config;
