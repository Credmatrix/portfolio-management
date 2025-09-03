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
                success: FluentColors.success,
                warning: FluentColors.warning,
                error: FluentColors.error,
                info: FluentColors.info,
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