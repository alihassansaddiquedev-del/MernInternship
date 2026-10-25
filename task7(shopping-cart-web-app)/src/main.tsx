import React from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './style.css';
import { App } from './components/App';

const mount = document.getElementById('app');
if (!mount) throw new Error('App mount point was not found');

createRoot(mount).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
