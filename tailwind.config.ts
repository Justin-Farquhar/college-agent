import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#26C74A',
          light: '#57FF7A',
          dark: '#1a9e3a',
        },
      },
    },
  },
  plugins: [],
};

export default config;

