import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        vscode: {
          bg: 'var(--vscode-bg)',
          sidebar: 'var(--vscode-sidebar)',
          activity: 'var(--vscode-activity)',
          border: 'var(--vscode-border)',
          text: 'var(--vscode-text)',
          'text-muted': 'var(--vscode-text-muted)',
          accent: 'var(--vscode-accent)',
          'accent-hover': 'var(--vscode-accent-hover)',
          selection: 'var(--vscode-selection)',
          hover: 'var(--vscode-hover)',
          input: 'var(--vscode-input)',
          error: 'var(--vscode-error)',
          warning: 'var(--vscode-warning)',
          success: 'var(--vscode-success)',
        },
        search: {
          highlight: 'var(--search-highlight)',
          'highlight-bg': 'var(--search-highlight-bg)',
        },
      },
      fontFamily: {
        editorial: ['Georgia', '"Times New Roman"', 'Times', 'serif'],
        mono: ['Consolas', 'Monaco', '"Courier New"', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
