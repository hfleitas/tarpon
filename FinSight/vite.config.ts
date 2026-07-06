import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// Standard Vite + React (SWC) setup — the same stack a real Rayfin frontend
// uses, so this app is drop-in compatible with `rayfin up`. Styling is plain
// CSS + inline styles (no Tailwind) so each app commits to its own look.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
