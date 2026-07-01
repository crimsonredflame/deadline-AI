// src/main.jsx
import React, { StrictMode } from 'react'; // <--- Import StrictMode here
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);