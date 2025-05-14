/** @type {import('tailwindcss').Config} */
const primeui = require('tailwindcss-primeui');

module.exports = {
    darkMode: ['selector', '[class="app-dark"]'],
    content: [
        './src/**/*.{html,ts,scss,css}',  // Only process html, ts, scss, and css files
        './src/index.html',
        './index.html'
    ],
    plugins: [primeui],
    theme: {
        screens: {
            sm: '576px',
            md: '768px',
            lg: '992px',
            xl: '1200px',
            '2xl': '1920px'
        }
    }
};
