import React from 'react'
import ReactDOM from 'react-dom/client'
import { injectSpeedInsights } from '@vercel/speed-insights'
import App from './App.jsx'
import './styles/main.css'

// 🧩 Importa los componentes base de SAP Fiori para React
import "@ui5/webcomponents-react/dist/Assets.js";
import "@ui5/webcomponents-fiori/dist/Assets.js";
import "@ui5/webcomponents-icons/dist/AllIcons.js";

// 📊 Initialize Vercel Speed Insights for performance monitoring
injectSpeedInsights();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
