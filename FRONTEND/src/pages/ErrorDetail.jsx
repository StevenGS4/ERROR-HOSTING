import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Tabs from "../components/Tabs";
import axios from "axios";

import {
  fetchErrorById,
  updateError,
  fetchAISolution,
} from "../services/errorService";

import {
  Card,
  CardHeader,
  FlexBox,
  FlexBoxDirection,
  Title,
  Text,
  Button,
  ObjectStatus,
  BusyIndicator,
  TextArea,
} from "@ui5/webcomponents-react";

function formatAIText(raw) {
  if (!raw) return "";

  const inlineFormat = (text) => {
    if (!text) return "";

    // código inline
    text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
    // **negritas**
    text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    // *cursiva*
    text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");

    return text;
  };

  let text = raw.replace(/\r\n/g, "\n");
  const lines = text.split("\n");

  let html = "";
  let inUl = false;
  let inOl = false;
  let inSubUl = false;
  let pOpen = false;

  const closeParagraph = () => {
    if (pOpen) {
      html += "</p>";
      pOpen = false;
    }
  };

  const closeAllLists = () => {
    if (inSubUl) {
      html += "</ul>";
      inSubUl = false;
    }
    if (inUl) {
      html += "</ul>";
      inUl = false;
    }
    if (inOl) {
      html += "</ol>";
      inOl = false;
    }
  };

  for (let line of lines) {
    const original = line;
    const trimmed = line.trim();

    // línea vacía => fin de párrafo
    if (!trimmed) {
      closeParagraph();
      continue;
    }

    // --------- / ________ => HR
    if (/^[-_]{3,}$/.test(trimmed)) {
      closeParagraph();
      closeAllLists();
      html += "<hr/>";
      continue;
    }

    // # headings
    let m = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (m) {
      const level = m[1].length;
      const txt = inlineFormat(m[2]);
      closeParagraph();
      closeAllLists();
      html += `<h${level}>${txt}</h${level}>`;
      continue;
    }

    // > cita
    m = trimmed.match(/^>\s+(.*)$/);
    if (m) {
      const txt = inlineFormat(m[1]);
      closeParagraph();
      closeAllLists();
      html += `<blockquote>${txt}</blockquote>`;
      continue;
    }

    // lista numerada: "1. texto"
    m = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (m) {
      const txt = inlineFormat(m[2]);
      closeParagraph();
      // cerramos UL si venía de antes
      if (inUl) {
        html += "</ul>";
        inUl = false;
      }
      if (!inOl) {
        html += "<ol>";
        inOl = true;
      }
      html += `<li>${txt}</li>`;
      continue;
    }

    // lista con viñetas (con posible sangría)
    m = original.match(/^(\s*)([-*])\s+(.*)$/);
    if (m) {
      const indent = m[1].length;
      const txt = inlineFormat(m[3]);
      closeParagraph();
      if (indent >= 2) {
        // sublista
        if (!inSubUl) {
          html += '<ul class="sublist">';
          inSubUl = true;
        }
        html += `<li>${txt}</li>`;
      } else {
        // nivel principal
        if (inSubUl) {
          html += "</ul>";
          inSubUl = false;
        }
        if (!inUl) {
          html += "<ul>";
          inUl = true;
        }
        html += `<li>${txt}</li>`;
      }
      continue;
    }

    // línea normal de párrafo
    closeAllLists();
    const txt = inlineFormat(trimmed);
    if (!pOpen) {
      html += `<p>${txt}`;
      pOpen = true;
    } else {
      html += `<br/>${txt}`;
    }
  }

  // Cerrar lo que quede abierto
  closeParagraph();
  closeAllLists();

  return html;
}

// Componente que pinta el texto IA con estilo tipo ChatGPT
// =======================================================
// 🔥 CHATGPT LAYOUT ENGINE — Versión ULTRA DELUXE
// =======================================================
const ChatGPTLayoutEngine = ({ content }) => {
  if (!content) return null;
  const html = formatAIText(content);

  return (
    <div
      style={{
        background: "white",
        color: "#1f2937",
        padding: "2rem",
        borderRadius: "16px",
        border: "1px solid #e5e7eb",
        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fontSize: "1rem",
        lineHeight: 1.75,
        maxHeight: "650px",
        overflowY: "auto",
        maxWidth: "100%",
        boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
        marginTop: "1.5rem",
        marginBottom: "1.5rem",
        whiteSpace: "normal",
      }}
    >
      {/* ESTILOS INTERNOS PARA LISTAS ANIDADAS Y HR */}
      <style>
        {`
        .chatgpt-content ul {
          margin-left: 1.4rem !important;
          margin-top: 0.3rem;
          margin-bottom: 0.3rem;
        }
        .chatgpt-content ul ul {
          margin-left: 1.2rem !important;
        }
        .chatgpt-content ol {
          margin-left: 1.5rem !important;
          margin-top: 0.3rem;
          margin-bottom: 0.3rem;
        }
        .chatgpt-content hr {
          margin-top: 1.8rem;
          margin-bottom: 1.8rem;
          border: none;
          border-top: 2px solid #e5e7eb;
        }
        .chatgpt-content p {
          margin-top: 0.6rem;
          margin-bottom: 0.6rem;
        }
      `}
      </style>

      <div
        className="chatgpt-content"
        dangerouslySetInnerHTML={{ __html: html }}
      ></div>
    </div>
  );
};

const ErrorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [showAISuggestion, setShowAISuggestion] = useState(false);

  // 🔹 Cargar error desde backend
  const loadError = async () => {
    console.log(error);
    try {
      setLoading(true);

      const { ok, rows, message } = await fetchErrorById(id);
      const data = Array.isArray(rows) ? rows : [rows];

      if (!ok || !data.length) throw new Error(message || "No encontrado");

      setError(data[0]);
    } catch (err) {
      console.error("❌ Error al cargar detalle:", err);
      alert("Error al cargar el detalle del error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadError();
  }, [id]);

  // 🔹 Actualizar estado (resolver o ignorar)
  const handleStatusChange = async (status) => {
    if (!window.confirm(`¿Seguro de marcar este error como ${status}?`)) return;

    try {
      setSaving(true);
      console.log("==================");
      console.log(error);

      const payload = {
        ...error,
        STATUS: status,
        RESOLVED_DATE: new Date(),
        RESOLVEDBY:
          status === "RESOLVED"
            ? loggedUser?.USERID ||
              loggedUser?.ALIAS ||
              loggedUser?.USERNAME ||
              "Desconocido"
            : error.RESOLVEDBY,
      };

      const { ok, message } = await updateError(payload);

      if (!ok) {
        alert("⚠️ No se pudo actualizar: " + message);
        return;
      }

      alert(`✅ Error marcado como ${status}`);
      navigate("/errors");
    } catch (err) {
      console.error("❌ Error al actualizar:", err);
      alert("Error interno al actualizar.");
    } finally {
      setSaving(false);
    }
  };

  // 🔹 Loading inicial
  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <BusyIndicator active size="Large" />
        <p>Cargando detalle...</p>
      </div>
    );
  }

  if (!error) {
    return (
      <p style={{ padding: "2rem" }}>No se encontró información del error.</p>
    );
  }

  // 🔹 Fecha
  const fecha = error.ERRORDATETIME
    ? new Date(error.ERRORDATETIME).toLocaleString("es-MX", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Fecha desconocida";

  const createdBy = error.CREATED_BY_APP || "Sistema";

  const ctxItem = Array.isArray(error.CONTEXT) ? error.CONTEXT[0] : null;

  const loggedUser = JSON.parse(localStorage.getItem("loggedUser") || "{}");
  const selectedServer = localStorage.getItem("selectedServer") || "mongo";
  // 🔥 ASIGNAR USUARIO A ERROR
  async function assignToUser(userId) {
    try {
      const res = await axios.post(
        `http://localhost:3334/api/error/assign?dbServer=${selectedServer}`,
        {
          errorId: error.ERRORID || error.rowKey, // ✔ usar ERRORID, no _id
          assignedUser: userId,
          assignedBy: loggedUser.USERID, // ✔
          STATUS: "IN_PROGRESS",
        }
      );

      alert("Usuario asignado correctamente.");
      loadError(); // recargar datos
    } catch (err) {
      console.error("❌ Error asignando usuario:", err);
      alert("Error asignando usuario.");
    }
  }

  async function unassignUser() {
    try {
      const updated = {
        ...error,
        ASIGNEDUSERS: [],
      };

      const { ok } = await updateError(updated);
      if (!ok) return alert("No se pudo quitar la asignación.");

      alert("Asignación eliminada.");
      loadError();
    } catch (err) {
      alert("Error quitando asignación.");
    }
  }

  // ============================================================
  // 🔹 TABS
  // ============================================================
  const tabs = [
    // ------------------------------------------------------------
    // 1) DESCRIPCIÓN
    // ------------------------------------------------------------
    {
      label: "Descripción del Error",
      content: (
        <div style={{ maxWidth: "100%", overflowX: "hidden" }}>
          <p>
            <b>Mensaje:</b> {error.ERRORMESSAGE}
          </p>
          <p>
            <b>Código:</b> {error.ERRORCODE}
          </p>
          <p>
            <b>Origen:</b> {error.ERRORSOURCE}
          </p>
          <p>
            <b>Severidad:</b> {error.SEVERITY}
          </p>
          <p>
            <b>Módulo:</b> {error.MODULE}
          </p>
          <p>
            <b>Aplicación:</b> {error.APPLICATION}
          </p>
          <p>
            <b>Generado por:</b> {createdBy}
          </p>
          <p>
            <b>Fecha:</b> {fecha}
          </p>
        </div>
      ),
    },

    // ------------------------------------------------------------
    // 2) USUARIOS
    // ------------------------------------------------------------
    {
      label: "Usuarios",
      content: (
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          {/* ============ BOTÓN: AGREGAR USUARIO PRO (abre modal) ============ */}
          {loggedUser.ROLES?.some((r) => r.ROLEID.startsWith("jefe.")) && (
            <div style={{ textAlign: "right", marginBottom: "1.5rem" }}>
              <ui5-button
                design="Emphasized"
                icon="add"
                onClick={() => document.getElementById("addUserDialog").show()}
              >
                Agregar Usuario
              </ui5-button>
            </div>
          )}

          {/* ============ TARJETAS DE USUARIOS ============ */}
          <h3>👥 Usuarios con acceso al error</h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "1.5rem",
              marginTop: "1rem",
            }}
          >
            {error.CANSEEUSERS?.length ? (
              error.CANSEEUSERS.map((u) => (
                <div
                  key={u}
                  style={{
                    background: "white",
                    borderRadius: "15px",
                    padding: "1.2rem",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    textAlign: "center",
                  }}
                >
                  {/* FOTO */}
                  <img
                    src={`https://i.pravatar.cc/120?u=${u}`}
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      marginBottom: "0.8rem",
                    }}
                  />

                  {/* TÍTULO */}
                  <h3 style={{ margin: "0.2rem 0" }}>{u}</h3>

                  <p style={{ margin: "0.3rem 0", color: "#6b7280" }}>
                    Puede ver este error
                  </p>

                  {/* BOTÓN: ASIGNAR */}
                  {loggedUser.ROLES?.some((r) =>
                    r.ROLEID.startsWith("jefe.")
                  ) && (
                    <ui5-button
                      design="Positive"
                      icon="employee"
                      style={{ width: "100%", marginTop: "0.5rem" }}
                      onClick={() => assignToUser(u)}
                    >
                      Asignar
                    </ui5-button>
                  )}

                  {/* BOTÓN: QUITAR VISUALIZACIÓN */}
                  {loggedUser.ROLES?.some((r) =>
                    r.ROLEID.startsWith("jefe.")
                  ) && (
                    <ui5-button
                      design="Negative"
                      icon="delete"
                      style={{ width: "100%", marginTop: "0.5rem" }}
                      onClick={async () => {
                        if (!confirm(`¿Quitar a ${u} de la visualización?`))
                          return;

                        const updated = {
                          ...error,
                          CANSEEUSERS: error.CANSEEUSERS.filter((x) => x !== u),
                        };

                        const { ok } = await updateError(updated);
                        if (!ok) return alert("No se pudo quitar.");

                        alert("Usuario removido.");
                        loadError();
                      }}
                    >
                      Quitar Visualización
                    </ui5-button>
                  )}
                </div>
              ))
            ) : (
              <i>Sin usuarios asignados</i>
            )}
          </div>

          {/* ============ USUARIO ASIGNADO ============ */}
          <h4 style={{ marginTop: "2rem" }}>👤 Usuario asignado:</h4>
          <p>{error.ASIGNEDUSERS?.[0] || "Ninguno"}</p>

          {/* BOTÓN: QUITAR ASIGNACIÓN */}
          {loggedUser.ROLES?.some((r) => r.ROLEID.startsWith("jefe.")) &&
            error.ASIGNEDUSERS?.length > 0 && (
              <ui5-button design="Negative" icon="reset" onClick={unassignUser}>
                Quitar Asignación
              </ui5-button>
            )}

          {/* ============ RESUELTO POR ============ */}
          <h4 style={{ marginTop: "1rem" }}>✔ Resuelto por:</h4>
          <p>{error.RESOLVEDBY || "Aún no resuelto"}</p>
        </div>
      ),
    },

    // ------------------------------------------------------------
    // 3) CONTEXTO TÉCNICO (todas las correcciones aquí)
    // ------------------------------------------------------------
    {
      label: "Contexto Técnico",
      content: (
        <div style={{ maxWidth: "100%", overflowX: "hidden" }}>
          {/* STACKTRACE */}
          {ctxItem?.stack && (
            <pre
              style={{
                background: "#0d1117",
                color: "#f0f6fc",
                padding: "1rem",
                borderRadius: "8px",
                fontFamily: "Consolas, Menlo, monospace",
                whiteSpace: "pre-wrap",
                marginBottom: "1rem",
                fontSize: "14px",
                lineHeight: "1.4",
                overflowX: "auto",
                maxWidth: "100%",
              }}
            >
              {ctxItem.stack}
            </pre>
          )}

          {/* JSON COMPLETO */}
          <pre
            style={{
              background: "#111827",
              color: "#f9fafb",
              padding: "1rem",
              borderRadius: "8px",
              whiteSpace: "pre-wrap",
              overflowX: "auto",
              maxWidth: "100%",
            }}
          >
            {JSON.stringify(error.CONTEXT, null, 2)}
          </pre>

          {/* HISTORIAL SESIÓN */}
          <h4 style={{ marginTop: "1.5rem", marginBottom: "0.5rem" }}>
            📝 Historial de Sesión
          </h4>

          <pre
            style={{
              background: "#0a0f18",
              color: "#9ee4ff",
              padding: "1rem",
              borderRadius: "8px",
              fontFamily: "Consolas, monospace",
              whiteSpace: "pre-wrap",
              fontSize: "13px",
              lineHeight: "1.5",
              maxHeight: "300px",
              overflowY: "auto",
              overflowX: "auto",
              maxWidth: "100%",
              border: "1px solid #1f2937",
            }}
          >
            {error.USER_SESSION_LOG?.length
              ? error.USER_SESSION_LOG.join("\n")
              : "No hay historial de sesión registrado."}
          </pre>
        </div>
      ),
    },

    // ------------------------------------------------------------
    // 4) FORO DE SOLUCIONES
    // ------------------------------------------------------------
    {
      label: "Foro de Soluciones",
      content: (
        <Card header={<CardHeader titleText="Foro de colaboración" />}>
          {/* LISTA DE COMENTARIOS */}
          <div
            style={{
              maxHeight: "300px",
              overflowY: "auto",
              maxWidth: "100%",
              overflowX: "hidden",
            }}
          >
            {error.COMMENTS?.length ? (
              error.COMMENTS.map((c, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: "1rem",
                    padding: "0.8rem",
                    borderRadius: "10px",
                    background: "#f3f4f6",
                    maxWidth: "100%",
                  }}
                >
                  {/* CABECERA DEL COMENTARIO */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.8rem",
                      maxWidth: "100%",
                    }}
                  >
                    <img
                      src={`https://i.pravatar.cc/50?u=${c.user}`}
                      style={{ borderRadius: "50%" }}
                    />
                    <div style={{ maxWidth: "100%", overflowX: "hidden" }}>
                      <strong>{c.user}</strong>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "#555",
                          margin: 0,
                        }}
                      >
                        {new Date(c.date).toLocaleString("es-MX")}
                      </p>
                    </div>
                  </div>

                  {/* MENSAJE — YA NO SE DESBORDA */}
                  <p
                    style={{
                      marginTop: "0.6rem",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                      maxWidth: "100%",
                    }}
                  >
                    {c.message}
                  </p>
                </div>
              ))
            ) : (
              <Text>📝 Aún no hay comentarios en este error.</Text>
            )}
          </div>

          {/* ENVIAR COMENTARIO */}
          <div style={{ marginTop: "1rem", maxWidth: "100%" }}>
            <TextArea
              rows={3}
              placeholder="Escribe un comentario..."
              id="commentBox"
              style={{ maxWidth: "100%" }}
            />

            <Button
              design="Emphasized"
              style={{ marginTop: "0.5rem" }}
              onClick={async () => {
                const box = document.getElementById("commentBox");
                const text = box.value.trim();
                if (!text) return alert("Escribe un mensaje antes de enviar");

                const loggedUser = JSON.parse(
                  localStorage.getItem("loggedUser")
                );
                const userName =
                  loggedUser?.USERID ||
                  loggedUser?.ALIAS ||
                  loggedUser?.USERNAME ||
                  "Anon";

                const newComment = {
                  user: userName,
                  message: text,
                  date: new Date().toISOString(),
                };

                const updated = {
                  ...error,
                  COMMENTS: [...(error.COMMENTS || []), newComment],
                };

                console.log("==================");
                console.log(updated.rowKey);

                const { ok } = await updateError(updated);
                if (!ok) return alert("⚠ No se pudo guardar el comentario");

                box.value = "";
                setError(updated);
              }}
            >
              Enviar
            </Button>
          </div>
        </Card>
      ),
    },

    // ------------------------------------------------------------
    // 5) SOLUCIÓN FINAL
    // ------------------------------------------------------------
    {
      label: "Solución Final",
      content: (() => {
        const loggedUser = JSON.parse(localStorage.getItem("loggedUser"));
        const solucionGuardada = Boolean(error.FINALSOLUTION);
        const solucion = error.FINALSOLUTION;
        console.log(error);

        return (
          <Card
            header={
              <CardHeader
                titleText="Solución final del error"
                action={
                  error.ASIGNEDUSERS.includes(loggedUser.USERID) && (
                    <Button
                      design="Positive"
                      icon="lightbulb"
                      tooltip="Generar sugerencia IA"
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.35rem 0.75rem",
                        borderRadius: "6px",
                        marginRight: "0.5rem",
                      }}
                      onClick={async () => {
                        setAiLoading(true);
                        const ai = await fetchAISolution(error._id);

                        if (!ai.ok) {
                          alert("❌ No se pudo obtener la sugerencia IA");
                          setAiLoading(false);
                          return;
                        }

                        setAiSuggestion(ai.ai);
                        setShowAISuggestion(true);
                        setAiLoading(false);
                      }}
                    >
                      IA
                    </Button>
                  )
                }
              />
            }
          >
            {/* Loader IA */}
            {aiLoading && (
              <p style={{ margin: "1rem 0" }}>
                <BusyIndicator active /> Generando sugerencia IA...
              </p>
            )}

            {/* PANEL DE SUGERENCIA IA */}
            {showAISuggestion && aiSuggestion && (
              <div
                style={{
                  marginTop: "1rem",
                  background: "#e0f2fe",
                  padding: "1rem",
                  borderRadius: "10px",
                  border: "1px solid #38bdf8",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                }}
              >
                <h4>🤖 Sugerencia generada por IA</h4>
                {/* Aquí se ve BONITO */}
                <ChatGPTLayoutEngine content={aiSuggestion} />
                <div
                  style={{
                    marginTop: "1rem",
                    background: "#e0f2fe",
                    padding: "1rem",
                    borderRadius: "10px",
                    border: "1px solid #38bdf8",
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: formatAIText(aiSuggestion),
                  }}
                />

                <Button
                  design="Negative"
                  style={{ marginTop: "1rem" }}
                  onClick={() => setShowAISuggestion(false)}
                >
                  Ocultar sugerencia IA
                </Button>

                <Button
                  design="Emphasized"
                  style={{ marginTop: "1rem", marginLeft: "1rem" }}
                  onClick={async () => {
                    const updated = {
                      ...error,
                      FINALSOLUTION: aiSuggestion,
                      AI_RESPONSE: aiSuggestion,
                      AI_REQUESTED: true,
                      RESOLVEDBY:
                        loggedUser?.USERID ||
                        loggedUser?.ALIAS ||
                        loggedUser?.USERNAME ||
                        "Desconocido",
                      RESOLVED_DATE: new Date().toISOString(),
                    };

                    const { ok } = await updateError(updated);
                    if (!ok) return alert("No se pudo guardar la sugerencia");

                    alert("Sugerencia IA guardada como solución final");
                    setError(updated);
                  }}
                >
                  Guardar como solución final
                </Button>
              </div>
            )}

            {/* =======================
            MODO — VER SOLUCIÓN
        ======================= */}
            {solucionGuardada && !error.FINAL_SOLUTION_EDIT_MODE ? (
              <div style={{ padding: "1rem", maxWidth: "100%" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                  }}
                >
                  <img
                    src={`https://i.pravatar.cc/60?u=${error.RESOLVEDBY}`}
                    style={{
                      borderRadius: "50%",
                      width: "60px",
                      height: "60px",
                    }}
                  />
                  <div>
                    <strong>{error.RESOLVEDBY}</strong>
                    <p style={{ fontSize: "0.75rem", margin: 0 }}>
                      {error.RESOLVED_DATE
                        ? new Date(error.RESOLVED_DATE).toLocaleString("es-MX")
                        : "Fecha no registrada"}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "1rem",
                    background: "transparent",
                    padding: 0,
                    borderRadius: "10px",
                  }}
                >
                  <ChatGPTLayoutEngine content={solucion} />
                </div>

                {error.ASIGNEDUSERS.includes(loggedUser.USERID) ? (
                  <Button
                    design="Transparent"
                    icon="edit"
                    style={{ marginTop: "1rem" }}
                    onClick={() => {
                      setError({
                        ...error,
                        FINAL_SOLUTION_EDIT_MODE: true,
                        FINALSOLUTION:
                          error.FINALSOLUTION || error.AI_RESPONSE || "",
                      });
                    }}
                  >
                    Editar solución
                  </Button>
                ) : null}
              </div>
            ) : null}

            {/* =======================
            MODO — EDITAR / AGREGAR
        ======================= */}
            {(!solucionGuardada || error.FINAL_SOLUTION_EDIT_MODE) && (
              <div style={{ padding: "1rem", maxWidth: "100%" }}>
                <Text>Aquí puedes documentar la solución definitiva.</Text>

                {error.ASIGNEDUSERS.includes(loggedUser.USERID) ? (
                  <TextArea
                    rows={6}
                    placeholder="Describe la solución completa..."
                    defaultValue={error.FINALSOLUTION || ""}
                    id="solutionBox"
                    style={{
                      marginTop: "1rem",
                      maxWidth: "100%",
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                    }}
                  />
                ) : null}

                {error.ASIGNEDUSERS.includes(loggedUser.USERID) ? (
                  <Button
                    design="Emphasized"
                    style={{ marginTop: "0.8rem" }}
                    onClick={async () => {
                      const sol = document
                        .getElementById("solutionBox")
                        .value.trim();
                      if (!sol)
                        return alert("La solución no puede estar vacía");

                      const updated = {
                        ...error,
                        FINALSOLUTION: sol,
                        RESOLVEDBY:
                          loggedUser?.USERID ||
                          loggedUser?.ALIAS ||
                          loggedUser?.USERNAME ||
                          "Desconocido",
                        RESOLVED_DATE: new Date().toISOString(),
                        FINAL_SOLUTION_EDIT_MODE: undefined,
                      };

                      const { ok } = await updateError(updated);
                      if (!ok) return alert("⚠ No se pudo guardar la solución");

                      alert("✅ Solución final guardada");

                      // ⭐ Recargar datos reales del backend
                      await loadError();

                      // ⭐ Salir del modo edición
                      setError((prev) => ({
                        ...prev,
                        FINAL_SOLUTION_EDIT_MODE: undefined,
                      }));
                    }}
                  >
                    Guardar solución
                  </Button>
                ) : null}
              </div>
            )}
          </Card>
        );
      })(),
    },
  ];

  // ============================================================
  // ESTADO VISUAL
  // ============================================================
  //---------------------------------------------------------------
  // 🔥 FILTRAR TABS SI EL USUARIO ES EL CREADOR DEL ERROR
  //---------------------------------------------------------------
  const isCreator = loggedUser.USERID === error.CREATED_BY_APP;

  let visibleTabs = tabs;

  if (isCreator) {
    visibleTabs = tabs.filter(
      (t) => t.label === "Descripción del Error" || t.label === "Solución Final"
    );
  }

  const statusState =
    error.STATUS === "RESOLVED"
      ? "Success"
      : error.STATUS === "IGNORED"
      ? "Warning"
      : "Error";

  return (
    <>
      {/* =====================================================
   MODAL PROFESIONAL — AGREGAR USUARIO
===================================================== */}
      <ui5-dialog
        id="addUserDialog"
        header-text="Agregar usuario al error"
        class="add-user-dialog"
      >
        <section style={{ padding: "1.2rem 1.5rem" }}>
          <p style={{ marginBottom: "0.5rem", color: "#4b5563" }}>
            Escribe el <b>USERID</b> del usuario que tendrá acceso a visualizar
            este error.
          </p>

          <ui5-input
            id="newUserId"
            placeholder="Ejemplo: DEVPROD01"
            show-clear-icon
            style={{ width: "100%" }}
          ></ui5-input>

          {/* Mensaje de validación */}
          <div
            id="userValidationMsg"
            style={{
              marginTop: "0.5rem",
              color: "#dc2626",
              fontSize: "0.85rem",
              display: "none",
            }}
          >
            ⚠ Debes ingresar un USERID válido.
          </div>

          {/* Confirmación elegante */}
          <div
            id="userConfirmMsg"
            style={{
              marginTop: "0.8rem",
              color: "#2563eb",
              fontSize: "0.9rem",
              display: "none",
            }}
          >
            ¿Confirmas agregar este usuario?
          </div>
        </section>

        {/* FOOTER */}
        <div
          slot="footer"
          style={{
            display: "flex",
            gap: "1rem",
            padding: "1rem",
            justifyContent: "flex-end",
          }}
        >
          <ui5-button
            design="Transparent"
            onClick={() => document.getElementById("addUserDialog").close()}
          >
            Cancelar
          </ui5-button>

          <ui5-button
            design="Emphasized"
            id="confirmAddUser"
            onClick={async () => {
              const input = document.getElementById("newUserId");
              const dialog = document.getElementById("addUserDialog");
              const msg = document.getElementById("userValidationMsg");
              const confirmBox = document.getElementById("userConfirmMsg");

              const userId = input.value.trim();

              // limpiar mensajes
              msg.style.display = "none";
              confirmBox.style.display = "none";

              if (!userId) {
                msg.textContent = "⚠ Por favor ingresa un USERID.";
                msg.style.display = "block";
                return;
              }

              // Mostrar confirmación elegante
              confirmBox.style.display = "block";

              // Esperar 600ms antes de agregar (simula "confirmación UI")
              setTimeout(async () => {
                try {
                  const updated = {
                    ...error,
                    CANSEEUSERS: [...(error.CANSEEUSERS || []), userId],
                  };

                  const { ok } = await updateError(updated);
                  if (!ok) {
                    msg.textContent = "⚠ No se pudo agregar este usuario.";
                    msg.style.display = "block";
                    return;
                  }

                  input.value = "";
                  dialog.close();
                  loadError();
                } catch (e) {
                  msg.textContent = "⚠ Error al agregar usuario.";
                  msg.style.display = "block";
                }
              }, 600);
            }}
          >
            Agregar
          </ui5-button>
        </div>
      </ui5-dialog>

      {/* =====================================================
          CONTENIDO PRINCIPAL
      ===================================================== */}
      <div style={{ padding: "2rem" }}>
        <Title level="H2">🧩 Detalle del Error — {error.ERRORCODE}</Title>

        {/* Header */}
        <Card
          header={
            <CardHeader
              titleText={error.ERRORMESSAGE}
              subtitleText={`${createdBy} — ${fecha}`}
              avatar={
                <img
                  src={`https://i.pravatar.cc/80?u=${createdBy}`}
                  alt={createdBy}
                  className="error-avatar"
                />
              }
            >
              <ObjectStatus slot="status" state={statusState} showDefaultIcon>
                {error.STATUS}
              </ObjectStatus>
            </CardHeader>
          }
        />

        {/* Tabs */}
        <div style={{ marginTop: "1.5rem" }}>
          <Tabs tabs={visibleTabs} />
        </div>

        {/* Botones */}
        <FlexBox
          direction={FlexBoxDirection.Row}
          style={{
            justifyContent: "flex-end",
            gap: "1rem",
            marginTop: "1.5rem",
          }}
        >
          {error.ASIGNEDUSERS.includes(loggedUser.USERID) ? (
            <Button
              design="Negative"
              disabled={saving || error.STATUS === "IGNORED"}
              onClick={() => handleStatusChange("IGNORED")}
            >
              🚫 Ignorar
            </Button>
          ) : null}

          {error.ASIGNEDUSERS.includes(loggedUser.USERID) ? (
            <Button
              design="Emphasized"
              disabled={saving || error.STATUS === "RESOLVED"}
              onClick={() => handleStatusChange("RESOLVED")}
            >
              ✅ Marcar Resuelto
            </Button>
          ) : null}
        </FlexBox>
      </div>
    </>
  );
};

export default ErrorDetail;
