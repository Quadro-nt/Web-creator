import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.tsx',
    './components/**/*.tsx',
    './lib/**/*.ts',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

export default config
