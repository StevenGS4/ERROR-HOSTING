// src/pages/ConfigPage.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  Button,
  Card,
  Title,
  Text,
  Input,
  Label,
  MessageStrip,
  TabContainer,
  Tab,
  BusyIndicator,
  FlexBox,
  FlexBoxDirection,
  Dialog,
  Switch,
} from "@ui5/webcomponents-react";

import axios from "axios";
import "../styles/configPage.css";

import "@ui5/webcomponents/dist/TabContainer.js";
import "@ui5/webcomponents/dist/Tab.js";
import "@ui5/webcomponents-icons/dist/employee.js";
import "@ui5/webcomponents-icons/dist/settings.js";
import "@ui5/webcomponents-icons/dist/sys-monitor.js";
import "@ui5/webcomponents-icons/dist/refresh.js";
import "@ui5/webcomponents-icons/dist/search.js";
import "@ui5/webcomponents-icons/dist/status-inactive.js";
import "@ui5/webcomponents-icons/dist/status-positive.js";

const USERS_API_BASE = `${import.meta.env.VITE_DOMINIO_USUARIOS}`

// Verifica que el valor SÓLO contenga dígitos y guiones (formato YYYY-MM-DD).
const isValidDateValue = (value) => {
  const dateRegex = /^[0-9-]*$/;
  return dateRegex.test(value);
};

// ======================================================
// 🔹 COMPONENTE PRINCIPAL
// ======================================================
export default function ConfigPage() {
  const [loggedUser, setLoggedUser] = useState(null);
  const [profileForm, setProfileForm] = useState({});
  const [activeTab, setActiveTab] = useState("tab-profile");

  const [savingProfile, setSavingProfile] = useState(false);
  const [message, setMessage] = useState(null);

  // ESTADOS PARA EL DIÁLOGO DEL AVATAR
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [newAvatarUrl, setNewAvatarUrl] = useState("");
  const newAvatarInputRef = useRef(null);

  const [isChecked, setIsChecked] = useState({});

  const handleChange = (e) => {
    const checked = e.target.checked;
    setIsChecked(checked);

    localStorage.setItem("selectedServer", checked ? "azure" : "mongo");

    console.log("Switch actual:", checked ? "azure" : "mongo");
  };

  useEffect(() => {
    const saved = localStorage.getItem("selectedServer");

    if (saved === "azure") {
      setIsChecked(true);
    } else {
      setIsChecked(false);
    }
  }, []);
  // ======================================================
  // 🔹 Cargar usuario desde localStorage y Formatear Fecha
  // ======================================================
  useEffect(() => {
    const saved = localStorage.getItem("loggedUser");
    if (!saved) return;

    try {
      const user = JSON.parse(saved);
      // Formatear BIRTHDATE a "YYYY-MM-DD"
      let formattedBirthdate = user.BIRTHDATE || "";
      if (formattedBirthdate && formattedBirthdate.length > 10) {
        formattedBirthdate = formattedBirthdate.substring(0, 10);
      }

      setLoggedUser(user);

      // Usar PROFILE_PIC_URL del usuario como principal
      const avatarUrl = user.PROFILE_PIC_URL
        ? user.PROFILE_PIC_URL
        : localStorage.getItem(`userAvatar_${user.USERID}`) ||
          `https://i.pravatar.cc/150?u=${user.USERID}`;

      setProfileForm({
        ...user,
        BIRTHDATE: formattedBirthdate, // Asignamos la fecha limpia al formulario
        AVATAR: avatarUrl,
      });
      setNewAvatarUrl(user.PROFILE_PIC_URL || "");
    } catch {
      // ignore
    }
  }, []);

  const showMessage = (type, text) => setMessage({ type, text });

  const mapMsgDesign = (t) =>
    t === "error" ? "Negative" : t === "success" ? "Positive" : "Information";

  // ======================================================
  // 🔹 Limpiar usuario: SOLO CAMPOS VÁLIDOS PARA updateOne
  // ======================================================
  const cleanUserForUpdate = (user) => {
    const allowed = [
      "USERID",
      "USERNAME",
      "EMAIL",
      "ALIAS",
      "PHONENUMBER",
      "EXTENSION",
      "COMPANYID",
      "CEDIID",
      "EMPLOYEEID",
      "ACTIVE",
    ];

    const clean = {};

    for (const key of allowed) {
      if (user[key] !== undefined) clean[key] = user[key];
    }

    return clean;
  };

  // ======================================================
  // 🚀 saveToServer compatible con SAP CAP (updateOne)
  // ======================================================
  const saveToServer = async (userToSave, loggedUserId) => {
    const cleanBody = cleanUserForUpdate(userToSave);

    const params = new URLSearchParams({
      ProcessType: "updateOne",
      DBServer: "MongoDB",
      LoggedUser: loggedUserId || "SYSTEM",
    });

    const url = `${USERS_API_BASE}?${params.toString()}`;

    console.log("📤 Enviando a backend (updateOne):", cleanBody);

    return axios.post(url, { usuario: cleanBody });

  };

  // ======================================================
  // 🔹 Manejar cambio de perfil con validación de fecha
  // ======================================================
  const handleProfileChange = (f) => (e) => {
    const value = e.target.value;

    // VALIDACIÓN PARA BIRTHDATE: ignora si contiene caracteres no numéricos/guiones
    if (f === "BIRTHDATE") {
      if (value && !isValidDateValue(value)) {
        console.warn("Entrada inválida en fecha.");
        return;
      }
    }

    setProfileForm((p) => ({ ...p, [f]: value }));
  };

  // ======================================================
  // 🌟 GUARDAR LA NUEVA URL DEL AVATAR 🌟
  // ======================================================
  const handleAvatarSave = async () => {
    const urlToSave = newAvatarUrl.trim();
    if (!loggedUser || !urlToSave) {
      setAvatarDialogOpen(false);
      return;
    }

    setSavingProfile(true);

    try {
      const merged = {
        ...loggedUser,
        PROFILE_PIC_URL: urlToSave, // Actualizar la URL para el backend
      };

      await saveToServer(merged, loggedUser.USERID);

      // Guardar en localStorage (incluyendo la nueva PROFILE_PIC_URL)
      localStorage.setItem("loggedUser", JSON.stringify(merged));

      // Actualizar el estado del frontend
      setLoggedUser(merged);
      setProfileForm((p) => ({
        ...p,
        PROFILE_PIC_URL: urlToSave, // Nuevo valor para el backend
        AVATAR: urlToSave, // Valor para mostrar en el frontend
      }));

      localStorage.removeItem(`userAvatar_${loggedUser.USERID}`);

      showMessage("success", "Foto de perfil actualizada correctamente");
    } catch (err) {
      console.error("❌ Error guardando URL del Avatar:", err);
      showMessage("error", "No se pudo guardar la nueva foto de perfil");
    } finally {
      setSavingProfile(false);
      setAvatarDialogOpen(false);
    }
  };

  // ======================================================
  // 🔹 Guardar perfil (solo campos válidos)
  // ======================================================
  const handleProfileSave = async () => {
    if (!loggedUser) return;
    setSavingProfile(true);

    try {
      // Mezclamos lo que había en loggedUser con lo editado en profileForm
      const merged = {
        ...loggedUser,
        ...profileForm,
        // Aseguramos que PROFILE_PIC_URL vaya al backend si se cambió localmente o ya existía
        PROFILE_PIC_URL:
          profileForm.PROFILE_PIC_URL || loggedUser.PROFILE_PIC_URL,
      };

      // El campo AVATAR es solo para la UI, no va al backend
      delete merged.AVATAR;

      await saveToServer(merged, loggedUser.USERID);

      // Guardamos versión actualizada en localStorage
      localStorage.setItem("loggedUser", JSON.stringify(merged));

      // Reestablecer avatar en el estado para la UI
      const avatar =
        merged.PROFILE_PIC_URL ||
        localStorage.getItem(`userAvatar_${merged.USERID}`);

      setLoggedUser(merged);
      setProfileForm({ ...merged, AVATAR: avatar });

      showMessage("success", "Perfil actualizado correctamente");
    } catch (err) {
      console.error("❌ Error guardando perfil:", err);
  console.log("🔥 Backend respondió:", err.response?.data);
  showMessage("error", "No se pudo guardar el perfil");
    } finally {
      setSavingProfile(false);
    }
  };

  if (!loggedUser)
    return (
      <div className="config-page-container">
        <BusyIndicator active size="Large" />
      </div>
    );

  const headerAvatar =
    profileForm.AVATAR || `https://i.pravatar.cc/48?u=${profileForm.USERID}`;

  const bigAvatar =
    profileForm.AVATAR || `https://i.pravatar.cc/150?u=${profileForm.USERID}`;

  // ======================================================
  // 🔹 RENDER
  // ======================================================
  return (
    <div className="config-page-container">
      {/* HEADER */}
      <div className="config-page-header">
        <div>
          <Title level="H1">Configuración</Title>
          <Text>Administra tu perfil</Text>
        </div>

        <div className="config-header-user">
          <img src={headerAvatar} alt="" className="config-header-avatar" />
          <div>
            <Text>{profileForm.USERNAME}</Text>
            <Text>{profileForm.USERID}</Text>
          </div>
        </div>
      </div>

      {message && (
        <MessageStrip
          design={mapMsgDesign(message.type)}
          style={{ marginBottom: "1rem" }}
        >
          {message.text}
        </MessageStrip>
      )}

      <TabContainer
        activeTabId={activeTab}
        onTabSelect={(e) => {
          const tab = e.detail?.tab || e.detail?.selectedTab;
          if (tab?.id) setActiveTab(tab.id);
        }}
      >
        {/* TAB PERFIL */}
        <Tab id="tab-profile" text="Mi Perfil" icon="employee">
          <Card>
            <div className="config-page-content">
              <FlexBox direction={FlexBoxDirection.Row} style={{ gap: "2rem" }}>
                {/* AVATAR Y BOTÓN DE CAMBIO */}
                <FlexBox
                  direction={FlexBoxDirection.Column}
                  style={{ gap: "0.5rem", alignItems: "center" }}
                >
                  <img src={bigAvatar} alt="" className="config-page-avatar" />
                  <Button
                    icon="refresh"
                    design="Emphasized"
                    onClick={() => {
                      setNewAvatarUrl(profileForm.PROFILE_PIC_URL || "");
                      setAvatarDialogOpen(true);
                      setTimeout(() => newAvatarInputRef.current?.focus(), 100);
                    }}
                  >
                    Cambiar Foto
                  </Button>
                </FlexBox>

                {/* FORM */}
                <div className="config-page-form">
                  <Label>ID</Label>
                  <Input value={profileForm.USERID} disabled />

                  {/* 🎂 CAMPO CUMPLEAÑOS */}
                  <Label>Cumpleaños</Label>
                  <Input
                    value={profileForm.BIRTHDATE || ""}
                    onInput={handleProfileChange("BIRTHDATE")}
                    type="Date"
                    placeholder="AAAA-MM-DD"
                  />

                  <Label>Nombre</Label>
                  <Input
                    value={profileForm.USERNAME}
                    onInput={handleProfileChange("USERNAME")}
                  />

                  <Label>Email</Label>
                  <Input
                    value={profileForm.EMAIL}
                    onInput={handleProfileChange("EMAIL")}
                  />

                  <Label>Alias</Label>
                  <Input
                    value={profileForm.ALIAS || ""}
                    onInput={handleProfileChange("ALIAS")}
                  />

                  <Label>Teléfono</Label>
                  <Input
                    value={profileForm.PHONENUMBER || ""}
                    onInput={handleProfileChange("PHONENUMBER")}
                    type="Text"
                  />

                  <Label>Extensión</Label>
                  <Input
                    value={profileForm.EXTENSION || ""}
                    onInput={handleProfileChange("EXTENSION")}
                    disabled
                  />

                  <Label>Company ID</Label>
                  <Input
                    value={profileForm.COMPANYID || ""}
                    onInput={handleProfileChange("COMPANYID")}
                    disabled
                  />

                  <Label>Employee ID</Label>
                  <Input
                    value={profileForm.EMPLOYEEID || ""}
                    onInput={handleProfileChange("EMPLOYEEID")}
                    disabled
                  />
                </div>
              </FlexBox>

              <div className="config-page-footer">
                <Button onClick={handleProfileSave} disabled={savingProfile}>
                  {savingProfile ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            </div>
          </Card>
        </Tab>

        {/* TAB SERVER CONFIG */}
        <Tab id="tab-profile" text="Server Configuration" icon="settings">
          <Card>
            <div className="config-page-content">
              <FlexBox direction={FlexBoxDirection.Row} style={{ gap: "2rem" }}>
                {/* FORM */}
                <div className="config-page-form">
                  <Label>Server</Label>
                  <FlexBox
                    direction={FlexBoxDirection.Row}
                    justifyContent="Center"
                    alignItems="Center"
                    style={{ gap: "2rem", height: "100px" }} // puedes ajustar la altura
                  >
                    <Label>Mongo</Label>
                    <Switch
                      checked={isChecked}
                      onChange={handleChange}
                      textOn="Azure"
                      textOff="Mongo"
                      style={{ padding: "0.5rem" }}
                    />
                    <Label>Azure</Label>
                  </FlexBox>
                </div>
              </FlexBox>
            </div>
          </Card>
        </Tab>
      </TabContainer>

      {/* DIÁLOGO PARA CAMBIAR FOTO DE PERFIL */}
      <Dialog
        headerText="Cambiar Foto de Perfil"
        open={avatarDialogOpen}
        onAfterClose={() => setAvatarDialogOpen(false)}
        footer={
          <>
            <Button design="Emphasized" onClick={handleAvatarSave}>
              Guardar URL
            </Button>
            <Button
              design="Transparent"
              onClick={() => setAvatarDialogOpen(false)}
            >
              Cancelar
            </Button>
          </>
        }
      >
        <div style={{ padding: "1rem" }}>
          <Text style={{ marginBottom: "1rem", display: "block" }}>
            Introduce la nueva URL de la imagen de tu perfil.
          </Text>
          <Input
            ref={newAvatarInputRef}
            placeholder="Ej: https://miservidor.com/mi-foto.jpg"
            value={newAvatarUrl}
            onInput={(e) => setNewAvatarUrl(e.target.value)}
            style={{ width: "100%" }}
          />
          <img
            src={newAvatarUrl || bigAvatar}
            alt="Vista previa"
            style={{
              width: "100%",
              height: "auto",
              marginTop: "1rem",
              maxHeight: "200px",
              objectFit: "contain",
              border: "1px solid #ccc",
            }}
            onError={(e) => (e.target.src = bigAvatar)} // Fallback visual
          />
        </div>
      </Dialog>
    </div>
  );
}
