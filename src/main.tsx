import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

// Retire the pre-paint splash beat in index.html once React has actually
// mounted. Two frames of headroom so the first paint is the app, not a blank
// gap — removing it synchronously reintroduces the flash it exists to prevent.
//
// MIN_BEAT is why this is not just "remove on mount". Walk 5 recorded ten cold
// starts and found the wordmark on screen for zero frames of all of them: React
// mounts while the native splash is still up, so #boot was being torn down
// behind the splash and the launch read as 2.2s of blank paper. Holding it for a
// minimum from page start means the splash hands over ONTO the wordmark rather
// than over its corpse — the "two beats read as one continuous screen" the
// comment in index.html promises. Measured from navigation start, not from
// mount, so a fast device waits and a slow one does not pay twice.
const MIN_BEAT_MS = 900;

requestAnimationFrame(() =>
  requestAnimationFrame(() => {
    const boot = document.getElementById('boot');
    if (!boot) return;
    const elapsed = performance.now();
    const wait = Math.max(0, MIN_BEAT_MS - elapsed);
    setTimeout(() => {
      boot.classList.add('gone');
      setTimeout(() => boot.remove(), 320);
    }, wait);
  })
);
