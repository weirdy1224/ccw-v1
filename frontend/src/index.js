import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // ✅ Only global util file

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
