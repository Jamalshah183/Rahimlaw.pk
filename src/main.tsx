import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { PortalProvider } from './lib/portalStore';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <PortalProvider>
    <App />
  </PortalProvider>
);
