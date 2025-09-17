import type { Config } from 'tailwindcss'
import { FluentColors } from './lib/constants/colors'

const config: Config = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: FluentColors.primary,
                neutral: FluentColors.neutral,
                success: {
                    100: '#F3F9F1',
                    200: '#E1F5DC',
                    700: '#107C10',
                    DEFAULT: FluentColors.success,
                },
                warning: {
                    100: '#FFF8E1',
                    200: '#FFECB3',
                    700: '#E65100',
                    DEFAULT: FluentColors.warning,
                },
                error: {
                    100: '#FFEBEE',
                    200: '#FFCDD2',
                    700: '#D32F2F',
                    DEFAULT: FluentColors.error,
                },
                info: {
                    100: '#E1F5FE',
                    200: '#B3E5FC',
                    700: '#0277BD',
                    DEFAULT: FluentColors.info,
                },
            },
            fontFamily: {
                sans: ['Segoe UI', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                'fluent-1': '0 1.6px 3.6px 0 rgba(0, 0, 0, 0.132)',
                'fluent-2': '0 3.2px 7.2px 0 rgba(0, 0, 0, 0.108)',
                'fluent-3': '0 6.4px 14.4px 0 rgba(0, 0, 0, 0.096)',
                'fluent-4': '0 12.8px 28.8px 0 rgba(0, 0, 0, 0.072)',
            },
        },
    },
    plugins: [],
}

export default config