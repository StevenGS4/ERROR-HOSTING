import axios from "axios";

const BASE_URL = "http://localhost:3334/odata/v4/api/error/crud";

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
    const { data } = await axios.post(`${BASE_URL}?${query}`, body);
    return data;
  } catch (err) {
    console.error("❌ Error en callCrud:", err);
    return { success: false, data: [], messageUSR: err.message };
  }
}
