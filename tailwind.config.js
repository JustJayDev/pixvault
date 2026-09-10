/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#050508',
        vault: { violet: '#7C3AED', cyan: '#22D3EE' },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      animation: {
        'float-slow': 'float 14s ease-in-out infinite',
        'float-slower': 'float 22s ease-in-out infinite reverse',
        shimmer: 'shimmer 2.6s linear infinite',
        'fade-up': 'fadeUp .7s cubic-bezier(0.16,1,0.3,1) both',
        'pop-in': 'popIn .55s cubic-bezier(0.34,1.56,0.64,1) both',
        'vault-open': 'vaultOpen 1.1s cubic-bezier(.77,0,.18,1) both',
        'word-up': 'wordUp .8s cubic-bezier(0.16,1,0.3,1) both',
        'marquee': 'marquee 30s linear infinite',
        'spin-slow': 'spin 14s linear infinite',
        'pulse-glow': 'pulseGlow 3.2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(4%,-6%,0) scale(1.08)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(26px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        vaultOpen: {
          '0%': { transform: 'perspective(1200px) rotateY(0deg)' },
          '100%': { transform: 'perspective(1200px) rotateY(-105deg)' },
        },
        wordUp: {
          '0%': { opacity: '0', transform: 'translateY(110%) rotate(4deg)' },
          '100%': { opacity: '1', transform: 'translateY(0) rotate(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        pulseGlow: {
          '0%,100%': { opacity: '.5' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}