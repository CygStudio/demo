import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(() => {
  const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1]
  const isGithubActions = process.env.GITHUB_ACTIONS === 'true'

  return {
    base: isGithubActions && repoName ? `/${repoName}/` : '/',
    plugins: [react()],
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/react-curtain-sequence/test/setup.js'],
    },
    build: {
      rollupOptions: {
        input: {
          main: resolve(import.meta.dirname, 'index.html'),
          // reactCurtainSequence: resolve(import.meta.dirname, 'react-curtain-sequence/index.html'),
        },
      },
    },
  }
})
