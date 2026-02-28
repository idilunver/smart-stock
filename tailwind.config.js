/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                espresso: {
                    50: '#f7f6f5',
                    100: '#ebe9e6',
                    200: '#d1cdc6',
                    300: '#a7a195',
                    400: '#7d7465',
                    500: '#5c5448',
                    600: '#4a433a',
                    700: '#3d3730',
                    800: '#322d28',
                    900: '#2a2622',
                    DEFAULT: '#3d3730',
                },
                latte: '#f8f1e7',
                caramel: '#c68e5a',
                mocha: '#4e342e',
                crema: '#fff9f0',
                brand: {
                    50: '#f5f7ff',
                    100: '#ebf0ff',
                    200: '#d6e0ff',
                    300: '#b3c7ff',
                    400: '#80a1ff',
                    500: '#4d7bff',
                    600: '#335eff',
                    700: '#2647e6',
                    800: '#1f3bb3',
                    900: '#1a3191',
                },
            },
        },
    },
    plugins: [],
}
