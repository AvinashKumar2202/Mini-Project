import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// import { BrowserRouter } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Suspense fallback={<div style={{ padding: '20px', color: 'white', background: '#0a0a14', minHeight: '100vh' }}>Loading SAAN App...</div>}>
    <>
      <App />
    </>
  </Suspense>,
);
