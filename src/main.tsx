import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

console.log('[Main] Starting application...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('[Main] Root element not found!');
  throw new Error('Root element not found');
}

console.log('[Main] Root element found, mounting app...');

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

console.log('[Main] App mounted successfully');
