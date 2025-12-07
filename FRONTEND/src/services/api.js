import axios from "axios";

// Helper genérico
export async function callCrud(queryType, body = {}, extraParams = {}) {
  const selectedServer = localStorage.getItem("selectedServer") || "mongo";
  const defaultParams = {
    LoggedUser: "Admin",
    dbServer: selectedServer || "mongo",
    ...extraParams, 
  };

  const query = new URLSearchParams({
    queryType,
    ...defaultParams,
  }).toString();

  try {
    const { data } = await axios.post(
      `${import.meta.env.VITE_API_BASE}?${query}`,
      body
    );
    return data;
  } catch (err) {
    console.error("❌ Error en callCrud:", err);
    console.log(err)
    return { success: false, data: [], messageUSR: err.message };
  }
}
