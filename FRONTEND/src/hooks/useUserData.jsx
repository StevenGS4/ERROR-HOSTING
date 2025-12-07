import { sendErrorToServer } from "../services/errorReporter";

export const useUserData = () => {
  const load = async () => {
    try {
      const res = await api.get("/users");
      return res.data;
    } catch (err) {
      sendErrorToServer(err, {
        component: "UserDashboard",
        function: "loadUserData()",
        module: "Usuarios",
        severity: "CRITICAL",
        code: "ERR-UI-104",
        source: "frontend/src/hooks/useUserData.jsx"
      });
      throw err; // opcional
    }
  };

  return load;
};
