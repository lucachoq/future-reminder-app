module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        royal: {
          50: '#eaf0fb',
          100: '#c8d8f6',
          200: '#a3bff0',
          300: '#7ea6ea',
          400: '#598de4',
          500: '#336ed1', // Royal Blue
          600: '#2957a6',
          700: '#1f407a',
          800: '#14294f',
          900: '#0a1324',
        },
        cobalt: {
          50: '#eaf3fa',
          100: '#c7e0f5',
          200: '#a3cdf0',
          300: '#7ebaea',
          400: '#59a7e5',
          500: '#2467c7', // Cobalt Blue
          600: '#1c519b',
          700: '#143b6f',
          800: '#0c2543',
          900: '#051018',
        },
        baby: {
          50: '#f0f7fd',
          100: '#d6eafd',
          200: '#bce0fc',
          300: '#a2d5fb',
          400: '#88cafb',
          500: '#6ebffb', // Baby Blue
          600: '#5699c9',
          700: '#3e7397',
          800: '#264d65',
          900: '#0e2733',
        },
        blue: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
    },
  },
  plugins: [],
}; 