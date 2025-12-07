import React, { useEffect, useState } from "react";
import { Button, BusyIndicator, Input, Text } from "@ui5/webcomponents-react";

import axios from "axios";
import "../styles/errorLogin.css";

export default function ErrorLogin() {
  const [user, setUser] = useState(null);
  const [manualId, setManualId] = useState("");
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("loggedUser");

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.USERID) setUser(parsed);
      } catch {}
      setLoading(false);
      return;
    }

    setLoading(false);
  }, []);

  // ============================================================
  // FUNCION DE LOGIN REAL
  // ============================================================
  const validarUsuario = async () => {
    if (!manualId.trim()) {
      setErrorMsg("Ingrese el ID de usuario");
      return;
    }

    try {
      setValidating(true);

      const res = await axios.post(
        `${
          import.meta.env.VITE_DOMINIO_USUARIOS
        }?ProcessType=getById&DBServer=MongoDB&LoggedUser=AGUIZARE`,

        {
          usuario: { USERID: manualId },
        }
      );

      // ======================================================
      // EXTRACCIÓN REAL
      // ======================================================
      const usuario =
        res.data?.value?.[0]?.data?.[0]?.dataRes || // TU API NORMAL
        res.data?.value?.[0]?.data?.[0] || // fallback
        null;

      if (!usuario) {
        setErrorMsg("Usuario no encontrado");
        return;
      }

      // ======================================================
      // ROLES
      // ======================================================
      const role = usuario.ROLES?.[0]?.ROLEID || "Sin rol";
      usuario.ROLEID = role; // lo guardamos para fácil acceso

      // usuario ya contiene PROFILE_PIC_URL si existe en la BD

      // Guardar en localStorage
      localStorage.setItem("loggedUser", JSON.stringify(usuario));

      setUser(usuario);
      setErrorMsg("");
    } catch (err) {
      console.error("Error login:", err);
      setErrorMsg("Usuario no encontrado");
    } finally {
      setValidating(false);
    }
  };

  const iniciarSesion = () => {
    window.location.href = "/errors";
  };

  // ============================================================
  // LOADING (No hay cambios aquí)
  // ============================================================
  if (loading)
    return (
      <div className="elogin-loading">
        <BusyIndicator active size="Large" />
        <Text style={{ marginTop: "10px", color: "#fff" }}>Cargando...</Text>
      </div>
    );

  // ============================================================
  // LOGIN MANUAL (No hay cambios aquí)
  // ============================================================
  if (!user)
    return (
      <div className="elogin-fullscreen">
        <div className="elogin-box">
          <h2 style={{ marginBottom: "6px" }}>Iniciar Sesión</h2>
          <p style={{ color: "#6e7a90", marginBottom: "1rem" }}>
            Introduce tu ID de usuario
          </p>

          <Input
            placeholder="Ej: GSTE"
            value={manualId}
            onInput={(e) => setManualId(e.target.value)}
            className="elogin-input"
          />

          {errorMsg && (
            <p style={{ color: "red", marginTop: "8px" }}>{errorMsg}</p>
          )}

          <Button
            design="Emphasized"
            className="elogin-button"
            onClick={validarUsuario}
            disabled={validating}
          >
            {validating ? "Validando..." : "Continuar"}
          </Button>
        </div>
      </div>
    );

  // ============================================================
  // CONFIRMAR IDENTIDAD
  // ============================================================

  // 🌟 LÓGICA AÑADIDA PARA DETERMINAR LA URL DEL AVATAR 🌟
  const avatarUrl = user.PROFILE_PIC_URL
    ? user.PROFILE_PIC_URL
    : `https://i.pravatar.cc/150?u=${user.USERID}`;

  return (
    <div className="elogin-fullscreen">
      <div className="elogin-box">
        <img
          src={avatarUrl} // <--- 🌟 ¡Usamos la URL guardada o el fallback! 🌟
          className="elogin-avatar"
          alt="avatar"
          // Manejo de error de carga de imagen opcional
          onError={(e) => {
            e.target.src = `https://i.pravatar.cc/150?u=${user.USERID}`; // Vuelve al pravatar si la URL falla
          }}
        />

        <div className="elogin-title">
          <h2>Acceso a ErrorManager</h2>
          <p>Confirmar identidad</p>
        </div>

        <h1>{user.USERNAME || "Sin nombre"}</h1>

        <span className="elogin-role">{user.ROLEID || "Sin rol"}</span>

        <div className="elogin-data">
          <p>
            <b>ID:</b> {user.USERID}
          </p>
          <p>
            <b>Email:</b> {user.EMAIL || "Sin email"}
          </p>
          <p>
            <b>Alias:</b> {user.ALIAS || "Sin alias"}
          </p>
        </div>

        <Button
          design="Emphasized"
          className="elogin-button"
          onClick={iniciarSesion}
        >
          Iniciar sesión
        </Button>
      </div>
    </div>
  );
}
