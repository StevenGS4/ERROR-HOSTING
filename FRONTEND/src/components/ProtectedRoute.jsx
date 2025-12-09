import { useEffect, useState } from "react";
import axios from "axios";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const { search, pathname } = location;

  const [validating, setValidating] = useState(true);
  const [allowed, setAllowed] = useState(false);

  // Ruta tipo /errors/:id
  const isErrorDetailRoute = /^\/errors\/[^/]+$/.test(pathname);

  const query = new URLSearchParams(search);
  const userParam = query.get("user");

  const loggedUser = localStorage.getItem("loggedUser");

  useEffect(() => {
    // 🔹 Si NO es ruta /errors/:id → Solo requerimos login normal
    if (!isErrorDetailRoute) {
      setAllowed(!!loggedUser);
      setValidating(false);
      return;
    }

    // 🔹 Si es /errors/:id pero NO viene user ?user=
    if (isErrorDetailRoute && !userParam) {
      setAllowed(!!loggedUser);
      setValidating(false);
      return;
    }

    // 🔹 Si es /errors/:id y VIENE user → validación con API
    const validarUsuario = async () => {
      try {
        const res = await axios.post(
          `${
            import.meta.env.VITE_DOMINIO_USUARIOS
          }?ProcessType=getById&DBServer=MongoDB&LoggedUser=AGUIZARE`,
          {
            usuario: { USERID: userParam },
          }
        );

        const usuario =
          res.data?.value?.[0]?.data?.[0]?.dataRes ||
          res.data?.value?.[0]?.data?.[0] ||
          null;

        if (!usuario) {
          setAllowed(false);
          setValidating(false);
          return;
        }

        const role = usuario.ROLES?.[0]?.ROLEID || "Sin rol";
        usuario.ROLEID = role;

        localStorage.setItem("loggedUser", JSON.stringify(usuario));

        setAllowed(true);
        setValidating(false);
      } catch (error) {
        console.error("Error en login:", error);
        setAllowed(false);
        setValidating(false);
      }
    };

    validarUsuario();
  }, [isErrorDetailRoute, userParam, loggedUser, pathname]);

  // =====================================================
  // LOADING (evita parpadeos y render incorrecto)
  // =====================================================
  if (validating) return null; // o spinner

  // =====================================================
  // REDIRECCIÓN FINAL
  // =====================================================
  if (!allowed) {
    return <Navigate to="/login-error" replace />;
  }

  return children;
}
