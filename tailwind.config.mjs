/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 医疗蓝主强调色
        medical: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#0066FF',
          600: '#0052CC',
          700: '#003D99',
          800: '#002966',
          900: '#001433',
        },
        // 健康绿辅助强调色
        health: {
          50: '#E6FFF8',
          100: '#B3FFE0',
          200: '#80FFC8',
          300: '#4DFFB0',
          400: '#1AFF98',
          500: '#00C896',
          600: '#00A07A',
          700: '#00785C',
          800: '#00503E',
          900: '#002820',
        },
        // 深炭灰文字
        ink: {
          50: '#F8F9FA',
          100: '#F1F3F5',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#6B7280',
          500: '#4B5563',
          600: '#374151',
          700: '#1F2937',
          800: '#1A1A2E',
          900: '#0F0F1A',
        },
      },
      fontFamily: {
        display: ['Sora', 'system-ui', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        container: '1280px',
      },
      borderRadius: {
        DEFAULT: '8px',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.8s ease-out forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};
