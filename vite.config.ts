import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import checker from "vite-plugin-checker"
export default defineConfig({
  plugins: [
    tailwindcss(),
    checker({terminal:true}),
  ],
})