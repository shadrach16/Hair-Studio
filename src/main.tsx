import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

// Retire the pre-paint splash beat in index.html once React has actually
// mounted. Two frames of headroom so the first paint is the app, not a blank
// gap — removing it synchronously reintroduces the flash it exists to prevent.
requestAnimationFrame(() =>
  requestAnimationFrame(() => {
    const boot = document.getElementById('boot');
    if (!boot) return;
    boot.classList.add('gone');
    setTimeout(() => boot.remove(), 320);
  })
);
