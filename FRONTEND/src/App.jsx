import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {
  ThemeProvider,
  FlexBox,
  FlexBoxDirection
} from "@ui5/webcomponents-react";

import "./styles/theme.css";

import Navbar from "./components/Navbar.jsx";
import Sidebar from "./components/Sidebar.jsx";

import Dashboard from "./pages/Dashboard.jsx";
import ErrorLog from "./pages/ErrorLog.jsx";
import ErrorDetail from "./pages/ErrorDetail.jsx";
import TestErrorPage from "./pages/TestErrorPage.jsx";
import ErrorLogin from "./pages/ErrorLogin.jsx";
import ConfigPage from "./pages/ConfigPage.jsx";

import NotificationToast from "./components/NotificationToast";
import ProtectedRoute from "./components/ProtectedRoute";
import { useUserSessionLog } from "./hooks/useUserSessionLog";


import "./styles/main.css";

import "@ui5/webcomponents/dist/Assets.js";
import "@ui5/webcomponents-fiori/dist/Assets.js";
import "@ui5/webcomponents-icons/dist/AllIcons.js";



function App() {
  return (
    <ThemeProvider>
      <Router>

        {/* ⭐ NOTIFICACIONES GLOBALES — SIEMPRE DISPONIBLES */}
        <NotificationToast />



        <Routes>

          {/* ⭐⭐⭐ RUTA EXTERNA → /test (SIN layout, SIN Sidebar, SIN Navbar) */}
          <Route path="/test" element={<TestErrorPage />} />
          <Route path="/login-error" element={<ErrorLogin />} />


          {/* ⭐⭐⭐ RUTAS INTERNAS CON LAYOUT SAP FIORI */}

          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <>
                  {/** 🔥 ACTIVA EL REGISTRO DE SESIÓN SOLO PARA USUARIOS LOGUEADOS */}
                  {useUserSessionLog()}

                  <FlexBox direction={FlexBoxDirection.Row} style={{ height: "100vh" }}>
                    <Sidebar />

                    <FlexBox direction={FlexBoxDirection.Column} style={{ flex: 1 }}>
                      <Navbar />

                      <div className="content">
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/errors" element={<ErrorLog />} />
                          <Route path="/errors/:id" element={<ErrorDetail />} />
                          <Route path="/config" element={<ConfigPage />} />
                        </Routes>
                      </div>

                    </FlexBox>
                  </FlexBox>
                </>
              </ProtectedRoute>
            }

          />


        </Routes>

      </Router>
    </ThemeProvider>
  );
}

export default App;
