import { useEffect } from "react";

export const useUserSessionLog = () => {
  useEffect(() => {
    let sessionLog = JSON.parse(localStorage.getItem("sessionLog")) || [];

    const pushLog = (msg) => {
      const timestamp = new Date().toLocaleTimeString("es-MX");
      sessionLog.push(`[${timestamp}] ${msg}`);
      localStorage.setItem("sessionLog", JSON.stringify(sessionLog));
    };

    // 🔵 1. Log de inicio
    pushLog("Sesión iniciada");

    // 🔵 2. Capturar navegación SPA
    const originalPushState = window.history.pushState;
    window.history.pushState = function (...args) {
      pushLog(`Navegación a: ${args[2]}`);
      return originalPushState.apply(history, args);
    };

    // 🔵 3. Capturar errores de consola
    const originalError = console.error;
    console.error = function (...args) {
      pushLog(`Console Error: ${args.join(" ")}`);
      originalError.apply(console, args);
    };

    const originalWarn = console.warn;
    console.warn = function (...args) {
      pushLog(`Console Warn: ${args.join(" ")}`);
      originalWarn.apply(console, args);
    };

    const originalLog = console.log;
    console.log = function (...args) {
      pushLog(`Console Log: ${args.join(" ")}`);
      originalLog.apply(console, args);
    };

    // 🔵 4. Capturar errores globales del navegador
    window.addEventListener("error", (e) => {
      pushLog(`Window Error: ${e.message}`);
    });

    window.addEventListener("unhandledrejection", (e) => {
      pushLog(`Unhandled Promise Rejection: ${e.reason}`);
    });

    return () => {};
  }, []);
};
