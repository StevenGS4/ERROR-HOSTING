import React, { useEffect, useState, useRef } from "react";
import ErrorCard from "../components/ErrorCard";
import { fetchErrors } from "../services/errorService";
import {
  Title,
  Input,
  Select,
  Button,
  Toolbar,
  ToolbarSpacer,
  BusyIndicator,
  Text,
  FlexBox,
  FlexBoxDirection,
} from "@ui5/webcomponents-react";

import "@ui5/webcomponents/dist/Option.js";
import "@ui5/webcomponents/dist/Dialog.js";

import "@ui5/webcomponents/dist/DatePicker.js";

import "@ui5/webcomponents-icons/dist/search.js";
import "@ui5/webcomponents-icons/dist/refresh.js";
import "@ui5/webcomponents-icons/dist/add.js";
import "@ui5/webcomponents-icons/dist/filter.js";
import { CheckBox } from "@ui5/webcomponents-react";
import axios from "axios";

/*
// Opciones para TYPE_ERROR
const TYPE_ERROR_OPTIONS = [
  "ALERT",
  "WARNING",
  "INFO",
  "SERVIDOR",
  "DATABASE",
  "INFRAESTRUCTURA",
  "EXTERNO",
  "FRONTEND",
  "UI",
  "COMPATIBILIDAD",
  "LOGICO",
  "HUMANO",
  "VALIDACION",
  "NEGOCIO",
  "PROCESO",
  "INTEGRACION",
  "SEGURIDAD",
  "AUTH",
  "FRAUDE",
  "PRODUCCION",
  "QA",
  "SANDBOX",
  "OTRO",
];



const SEVERITY_OPTIONS = ["INFO", "WARNING", "ERROR", "CRITICAL"];

const STATUS_OPTIONS = ["NEW", "IN_PROGRESS", "RESOLVED", "IGNORED"];
*/

const ErrorLog = () => {
  const [errors, setErrors] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL"); // filtro rápido original
  const [lastUpdate, setLastUpdate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loggedUser, setLoggedUser] = useState({});

  console.log(errors)
  console.log(filter)

  // 🔥 Filtros avanzados
  const [advFilters, setAdvFilters] = useState({
    status: [],
    typeError: [],
    severity: [],
    order: "NEW", // NEW = más nuevo primero
    date: "ALL",
    dateFrom: null,
    dateTo: null,
  });

  const [catalogStatus, setCatalogStatus] = useState([]);
  const [catalogSeverity, setCatalogSeverity] = useState([]);
  const [catalogTypeError, setCatalogTypeError] = useState([]);
  console.log(catalogSeverity);
  console.log(import.meta.env.VITE_DOMINIO_CATALOGOS);

  const loadCatalogs = async () => {
    try {
      const commonPayload = {};

      // ---- STATUS_ISSUE ----
      const statusRes = await axios.post(
        `${
          import.meta.env.VITE_DOMINIO_CATALOGOS
        }?ProcessType=getLabelWithValues&LoggedUser=MIGUELLOPEZ&DBServer=CosmosDB&IDETIQUETA=STATUS_ISSUE`,
        commonPayload
      );

      setCatalogStatus(statusRes.data?.data?.[0]?.dataRes?.valores || []);

      // ---- SEVERITY_LEVEL ----
      const severityRes = await axios.post(
        `${
          import.meta.env.VITE_DOMINIO_CATALOGOS
        }?ProcessType=getLabelWithValues&LoggedUser=MIGUELLOPEZ&DBServer=CosmosDB&IDETIQUETA=SEVERITY_LEVEL`,
        commonPayload
      );
      setCatalogSeverity(severityRes.data?.data?.[0]?.dataRes?.valores || []);

      // ---- TYPE_ERROR ----
      const typeErrorRes = await axios.post(
        `${
          import.meta.env.VITE_DOMINIO_CATALOGOS
        }?ProcessType=getLabelWithValues&LoggedUser=MIGUELLOPEZ&DBServer=CosmosDB&IDETIQUETA=TYPE_ERROR`,
        commonPayload
      );
      setCatalogTypeError(typeErrorRes.data?.data?.[0]?.dataRes?.valores || []);
    } catch (err) {
      console.error("❌ Error cargando catálogos", err);
    }
  };

  const filterDialogRef = useRef(null);

  // ============================================================
  // Cargar errores
  // ============================================================

  const getLoggedUser = () => {
    let user = localStorage.getItem("loggedUser");
    user = JSON.parse(user);
    setLoggedUser({
      USERID: user.USERID,
      ROLEID: user.ROLEID,
    });
    console.log(user);
  };

  const loadErrors = async () => {
    getLoggedUser();
    try {
      setLoading(true);
      const { ok, rows } = await fetchErrors();
      if (ok && Array.isArray(rows)) {
        console.log(rows);
        setErrors(rows);
        setLastUpdate(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error("❌ Error al cargar errores:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadErrors();
    loadCatalogs();

    const interval = setInterval(loadErrors, 10000);
    return () => clearInterval(interval);
  }, []);

  // ============================================================
  // Helpers para filtros avanzados
  // ============================================================

  // ============================================================
  // Helpers para filtros avanzados
  // ============================================================

  const toggleArrayFilter = (key, value, checked) => {
    setAdvFilters((prev) => {
      const current = prev[key] || [];
      let next = current;

      if (checked) {
        if (!current.includes(value)) {
          next = [...current, value];
        }
      } else {
        next = current.filter((v) => v !== value);
      }

      const updated = {
        ...prev,
        [key]: next,
      };

      console.log("Nuevo estado:", updated);

      return updated;
    });
  };

  // ---- handlers corregidos ----

  const handleStatusCheckboxChange = (event) => {
    // const element = document.
    const value = event.target.getAttribute("value");
    const checked = event.target.checked;
    console.log('4444444444')
    console.log(value);
    console.log(checked);
    toggleArrayFilter("status", value, checked);
  };

  const handleTypeErrorCheckboxChange = (event) => {
    const value = event.target.getAttribute("value");
    const checked = event.target.checked;
    console.log(value);
    console.log(checked);
    toggleArrayFilter("typeError", value, checked);
  };

  const handleSeverityCheckboxChange = (event) => {
    const value = event.target.getAttribute("value");
    const checked = event.target.checked;
    console.log(value);
    console.log(checked);
    toggleArrayFilter("severity", value, checked);
  };

  // ---- mantienen su código original ----

  const handleOrderChange = (event) => {
    const value = event.detail.selectedOption.value;
    setAdvFilters((prev) => ({
      ...prev,
      order: value,
    }));
  };

  const handleDateModeChange = (event) => {
    const value = event.detail.selectedOption.value;
    setAdvFilters((prev) => ({
      ...prev,
      date: value,
    }));
  };

  const handleDateFromChange = (event) => {
    const value = event.target.value;
    setAdvFilters((prev) => ({
      ...prev,
      dateFrom: value || null,
    }));
  };

  const handleDateToChange = (event) => {
    const value = event.target.value;
    setAdvFilters((prev) => ({
      ...prev,
      dateTo: value || null,
    }));
  };

  const openFilterDialog = () => {
    if (filterDialogRef.current) {
      filterDialogRef.current.show();
    }
  };

  const [applyTrigger, setApplyTrigger] = useState(0);

  // ---- aplicar funcional ----
  const applyFilters = () => {
    console.log(`filtros `);
    console.log(advFilters);
    setApplyTrigger((prev) => prev + 1); // 🔥 fuerza rerender y recálculo
    console.log(`FIltros ${applyTrigger}`);
    filterDialogRef.current?.close();
  };

  // ---- limpiar COMPLETO ----
  const clearFilters = () => {
    // resetear filtros
    setAdvFilters({
      status: [],
      typeError: [],
      severity: [],
      order: "NEW",
      date: "ALL",
      dateFrom: null,
      dateTo: null,
    });

    // resetear UI (checkboxes y date pickers)
    const dialog = filterDialogRef.current;
    if (!dialog) return;

    dialog.querySelectorAll("CheckBox").forEach((el) => (el.checked = false));

    dialog.querySelectorAll("ui5-date-picker").forEach((el) => (el.value = ""));
  };

  // ============================================================
  // Funciones de filtrado avanzado
  // ============================================================

  function applyStatusFilterAdvanced(e) {
    if (!advFilters.status || advFilters.status.length === 0) return true;
    return advFilters.status.includes(e.STATUS);
  }

  function applyTypeErrorFilter(e) {
    if (!advFilters.typeError || advFilters.typeError.length === 0) return true;
    return advFilters.typeError.includes(e.TYPE_ERROR);
  }

  function applySeverityFilter(e) {
    if (!advFilters.severity || advFilters.severity.length === 0) return true;
    return advFilters.severity.includes(e.SEVERITY);
  }

  function applyDateFilter(e) {
    if (!e.ERRORDATETIME) return true;

    if (advFilters.date === "ALL") return true;

    const d = new Date(e.ERRORDATETIME);

    if (advFilters.date === "TODAY") {
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }

    if (advFilters.date === "WEEK") {
      const now = new Date();
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return d >= oneWeekAgo && d <= now;
    }

    if (advFilters.date === "MONTH") {
      const now = new Date();
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    }

    if (advFilters.date === "YEAR") {
      const now = new Date();
      return d.getFullYear() === now.getFullYear();
    }

    if (advFilters.date === "RANGE") {
      const { dateFrom, dateTo } = advFilters;
      if (!dateFrom && !dateTo) return true;

      const from = dateFrom ? new Date(dateFrom) : null;
      const to = dateTo ? new Date(dateTo) : null;

      if (from && to) return d >= from && d <= to;
      if (from && !to) return d >= from;
      if (!from && to) return d <= to;
    }

    return true;
  }

  // ============================================================
  // Ordenamiento
  // ============================================================
  function compareByOrder(a, b) {
    const order = advFilters.order || "NEW";

    const codeA = (a.ERRORCODE || "").toString();
    const codeB = (b.ERRORCODE || "").toString();

    const dateA = a.ERRORDATETIME ? new Date(a.ERRORDATETIME) : new Date(0);
    const dateB = b.ERRORDATETIME ? new Date(b.ERRORDATETIME) : new Date(0);

    if (order === "A-Z") {
      return codeA.localeCompare(codeB);
    }
    if (order === "Z-A") {
      return codeB.localeCompare(codeA);
    }
    if (order === "OLD") {
      return dateA - dateB;
    }
    // "NEW" por defecto: más nuevo primero
    if (order === "NEW") {
      return dateB - dateA;
    }

    return 0;
  }

  // ============================================================
  // 1) Búsqueda + filtro rápido + filtros avanzados
  // ============================================================
  const filteredErrors = React.useMemo(() => {
    return (
      errors
        // 🔎 Búsqueda universal
        .filter((e) => {
          if (!search.trim()) return true;
          const text = search.toLowerCase();
          const full = JSON.stringify(e)
            .toLowerCase()
            .replace(/[\n\r]/g, " ");
          return full.includes(text);
        })
        // Filtro rápido por estado (Select original)
        .filter((e) => {
          if (filter === "ALL") return true;
          if (filter === "UNRESOLVED")
            return e.STATUS === "NEW" || e.STATUS === "IN_PROGRESS";
          if (filter === "RESOLVED") return e.STATUS === "RESOLVED";
          if (filter === "IGNORED") return e.STATUS === "IGNORED";
          return true;
        })
        // Filtros avanzados
        .filter(applyStatusFilterAdvanced)
        .filter(applyTypeErrorFilter)
        .filter(applySeverityFilter)
        .filter(applyDateFilter)
    );
  }, [errors, search, filter, advFilters, applyTrigger]);

  // ============================================================
  // 2) Separar PENDIENTES / IGNORADOS / RESUELTOS
  // ============================================================
  const newErrors = filteredErrors
    .filter((e) => e.STATUS === "NEW" || e.STATUS === "IN_PROGRESS")
    .sort(compareByOrder);

  const ignoredErrors = filteredErrors
    .filter((e) => e.STATUS === "IGNORED")
    .sort(compareByOrder);

  const resolvedErrors = filteredErrors
    .filter((e) => e.STATUS === "RESOLVED")
    .sort(compareByOrder);

  // ============================================================
  // 3) Agrupar por MES (ignorados y resueltos)
  // ============================================================
  const groupByMonth = (list) =>
    list.reduce((acc, error) => {
      const date = new Date(error.ERRORDATETIME);
      const monthKey = date.toLocaleString("es-MX", {
        month: "long",
        year: "numeric",
      });

      if (!acc[monthKey]) acc[monthKey] = [];
      acc[monthKey].push(error);

      // Ordenar dentro del mes según la misma lógica
      acc[monthKey].sort(compareByOrder);

      return acc;
    }, {});

  const ignoredByMonth = groupByMonth(ignoredErrors);
  const resolvedByMonth = groupByMonth(resolvedErrors);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div
      style={{
        padding: "2rem",
        background: "#f9fafb",
        minHeight: "100vh",
      }}
    >
      <Title level="H2">Error Log</Title>

      <Toolbar style={{ marginTop: "1rem", marginBottom: "1rem" }}>
        <Input
          placeholder="Buscar..."
          value={search}
          onInput={(e) => setSearch(e.target.value)}
          icon="search"
          showClearIcon
          style={{ width: "300px" }}
        />

        {/*
        <Select
          onChange={(e) =>
            setFilter(e.detail.selectedOption.value.toUpperCase())
          }
          style={{ width: "180px", marginLeft: "1rem" }}
        >
          <ui5-option value="ALL" selected>
            Todos
          </ui5-option>
          <ui5-option value="RESOLVED">Resueltos</ui5-option>
          <ui5-option value="UNRESOLVED">Pendientes</ui5-option>
          <ui5-option value="IGNORED">Ignorados</ui5-option>
        </Select>*/}

        <Button
          icon="filter"
          design="Transparent"
          onClick={openFilterDialog}
          style={{ marginLeft: "1rem" }}
        >
          Filtros
        </Button>

        <ToolbarSpacer />

        <Button
          icon="refresh"
          design="Transparent"
          onClick={loadErrors}
          disabled={loading}
        >
          {loading ? "Cargando..." : "Refrescar"}
        </Button>
      </Toolbar>

      {/* LOADING */}
      {loading && (
        <FlexBox
          direction={FlexBoxDirection.Column}
          style={{ alignItems: "center", margin: "2rem 0" }}
        >
          <BusyIndicator active size="Large" />
          <Text>Cargando errores...</Text>
        </FlexBox>
      )}

      {/* PENDIENTES */}
      {newErrors.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <Title level="H4">🆕 PENDIENTES</Title>
          {newErrors
            .filter(
              (err) =>
                err.CANSEEUSERS.includes(loggedUser.USERID) ||
                err.CREATED_BY_APP === loggedUser.USERID
            )

            .map((err) => (
              <ErrorCard key={err._id || err.ERRORID} error={err} />
            ))}

          {/* {newErrors.map((err) => (
            <ErrorCard key={err._id || err.ERRORID} error={err} />
          ))} */}
        </div>
      )}

      {/* IGNORED POR MES */}
      {Object.entries(ignoredByMonth).map(([month, list]) => (
        <div key={"ignored-" + month} style={{ marginBottom: "2rem" }}>
          <Title level="H4">📅 {month.toUpperCase()} — IGNORADOS</Title>
          {list
            .filter(
              (err) =>
                err.CANSEEUSERS.includes(loggedUser.USERID) ||
                err.CREATED_BY_APP === loggedUser.USERID
            )

            .map((err) => (
              <ErrorCard key={err._id || err.ERRORID} error={err} />
            ))}
        </div>
      ))}

      {/* RESOLVED POR MES */}
      {Object.entries(resolvedByMonth).map(([month, list]) => (
        <div key={"resolved-" + month} style={{ marginBottom: "2rem" }}>
          <Title level="H4">📅 {month.toUpperCase()} — RESUELTOS</Title>
          {/* {list.map((err) => (
            <ErrorCard key={err._id || err.ERRORID} error={err} />
          ))} */}
          {list
            .filter(
              (err) =>
                err.CANSEEUSERS.includes(loggedUser.USERID) ||
                err.CREATED_BY_APP === loggedUser.USERID
            )

            .map((err) => (
              <ErrorCard key={err._id || err.ERRORID} error={err} />
            ))}
        </div>
      ))}

      <Text style={{ marginTop: "1.5rem", color: "#555" }}>
        Última actualización: {lastUpdate || "Nunca"}
      </Text>

      {/* ======================================================
          D I A L O G   D E   F I L T R O S   A V A N Z A D O S
         ====================================================== */}
      <ui5-dialog
        ref={filterDialogRef}
        header-text="Filtros avanzados"
        style={{ width: "720px", maxWidth: "95vw" }}
      >
        <div
          style={{
            padding: "1.5rem",
            display: "grid",
            gap: "1.5rem",
            maxHeight: "70vh",
            overflowY: "auto",
          }}
        >
          {/* STATUS */}
          <section>
            <h4 style={{ marginBottom: "0.5rem" }}>Estado</h4>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.3rem",
              }}
            >
              {catalogStatus.map((s) => (
                <CheckBox
                  key={s.IDVALOR}
                  text={s.VALOR}
                  value={s.VALOR}
                  checked={advFilters.status.includes(s.VALOR)}
                  onChange={handleStatusCheckboxChange}
                />
              ))}
            </div>
          </section>

          {/* TYPE_ERROR */}
          <section>
            <h4 style={{ marginBottom: "0.5rem" }}>Tipo de error</h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: "0.3rem",
              }}
            >
              {catalogTypeError.map((t) => (
                <CheckBox
                  key={t.IDVALOR}
                  text={t.VALOR}
                  value={t.VALOR}
                  checked={advFilters.typeError.includes(t.VALOR)}
                  onChange={handleTypeErrorCheckboxChange}
                />
              ))}
            </div>
          </section>

          {/* SEVERITY */}
          <section>
            <h4 style={{ marginBottom: "0.5rem" }}>Severidad</h4>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.3rem",
              }}
            >
              {catalogSeverity.map((s) => (
                <CheckBox
                  key={s.IDVALOR}
                  text={s.VALOR}
                  value={s.VALOR}
                  checked={advFilters.severity.includes(s.VALOR)}
                  onChange={handleSeverityCheckboxChange}
                />
              ))}
            </div>
          </section>

          {/* ORDEN */}
          <section>
            <h4 style={{ marginBottom: "0.5rem" }}>Ordenar por</h4>
            <Select onChange={handleOrderChange} style={{ width: "220px" }}>
              <ui5-option value="A-Z">A → Z (por código)</ui5-option>
              <ui5-option value="Z-A">Z → A (por código)</ui5-option>
              <ui5-option value="OLD">Más viejo primero</ui5-option>
              <ui5-option value="NEW" selected>
                Más nuevo primero
              </ui5-option>
            </Select>
          </section>

          {/* FECHA */}
          <section>
            <h4 style={{ marginBottom: "0.5rem" }}>Fecha</h4>
            <Select onChange={handleDateModeChange} style={{ width: "260px" }}>
              <ui5-option value="ALL" selected={advFilters.date === "ALL"}>
                Todos
              </ui5-option>
              <ui5-option value="TODAY" selected={advFilters.date === "TODAY"}>
                Hoy
              </ui5-option>
              <ui5-option value="WEEK" selected={advFilters.date === "WEEK"}>
                Esta semana
              </ui5-option>
              <ui5-option value="MONTH" selected={advFilters.date === "MONTH"}>
                Este mes
              </ui5-option>
              <ui5-option value="YEAR" selected={advFilters.date === "YEAR"}>
                Este año
              </ui5-option>
              <ui5-option value="RANGE" selected={advFilters.date === "RANGE"}>
                Rango personalizado…
              </ui5-option>
            </Select>

            {advFilters.date === "RANGE" && (
              <div style={{ marginTop: "0.8rem" }}>
                <ui5-date-picker
                  placeholder="Desde"
                  value={advFilters.dateFrom || ""}
                  onChange={handleDateFromChange}
                  style={{ display: "block", marginBottom: "0.4rem" }}
                />
                <ui5-date-picker
                  placeholder="Hasta"
                  value={advFilters.dateTo || ""}
                  onChange={handleDateToChange}
                  style={{ display: "block" }}
                />
              </div>
            )}
          </section>
        </div>

        <div
          slot="footer"
          style={{
            padding: "1rem",
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <Button design="Transparent" onClick={clearFilters}>
            Limpiar
          </Button>
          <Button design="Emphasized" onClick={applyFilters}>
            Aplicar
          </Button>
        </div>
      </ui5-dialog>
    </div>
  );
};

export default ErrorLog;
