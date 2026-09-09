/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#050508',
        vault: {
          violet: '#7C3AED',
          cyan: '#22D3EE',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float-slow': 'float 14s ease-in-out infinite',
        'float-slower': 'float 22s ease-in-out infinite reverse',
        shimmer: 'shimmer 2.2s linear infinite',
        'fade-up': 'fadeUp .6s cubic-bezier(.21,1.02,.73,1) both',
        'pop-in': 'popIn .45s cubic-bezier(.21,1.02,.73,1) both',
        'vault-open': 'vaultOpen 1.1s cubic-bezier(.77,0,.18,1) both',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(4%, -6%, 0) scale(1.08)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        vaultOpen: {
          '0%': { transform: 'perspective(1200px) rotateY(0deg)' },
          '100%': { transform: 'perspective(1200px) rotateY(-105deg)' },
        },
      },
    },
  },
  plugins: [],
}
