import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    './index.html',
  ],
  theme: {
    extend: {
      colors: {
        past: '#1D9E75',
        ongoing: '#EF9F27',
        future: '#534AB7',
        wb: {
          green: '#27500A',
          bg: '#EAF3DE',
        },
        career: {
          brown: '#633806',
          bg: '#FAEEDA',
        },
      },
    },
  },
  plugins: [],
}

export default config
