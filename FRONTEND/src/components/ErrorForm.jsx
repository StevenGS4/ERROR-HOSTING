import React, { useState, useEffect } from "react";
import {
  Dialog,
  Input,
  TextArea,
  Select,
  Option,
  Button,
  Label,
  FlexBox,
  FlexBoxDirection,
  Title
} from "@ui5/webcomponents-react";

export default function ErrorForm({ open, initialValue, onClose, onSubmit }) {
  const [form, setForm] = useState({
    ERRORMESSAGE: "",
    ERRORCODE: "",
    ERRORSOURCE: "",
    SEVERITY: "ERROR",
    STATUS: "NEW",
    MODULE: "UI",
    APPLICATION: "Error Manager",
  });

  // 🔹 Cargar valores iniciales si existen
  useEffect(() => {
    if (initialValue) setForm((prev) => ({ ...prev, ...initialValue }));
  }, [initialValue]);

  if (!open) return null;

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(form);
  };

  return (
    <Dialog
      open={open}
      headerText={initialValue ? "Editar error" : "Nuevo error"}
      onAfterClose={onClose}
      style={{ width: "600px" }}
    >
      <form onSubmit={handleSubmit} style={{ padding: "1rem" }}>
        <FlexBox direction={FlexBoxDirection.Column} style={{ gap: "1rem" }}>
          {/* Mensaje */}
          <div>
            <Label for="ERRORMESSAGE">Mensaje</Label>
            <TextArea
              id="ERRORMESSAGE"
              name="ERRORMESSAGE"
              required
              value={form.ERRORMESSAGE}
              onChange={handleChange}
            />
          </div>

          {/* Código y Fuente */}
          <FlexBox direction={FlexBoxDirection.Row} style={{ gap: "1rem" }}>
            <div style={{ flex: 1 }}>
              <Label for="ERRORCODE">Código</Label>
              <Input
                id="ERRORCODE"
                name="ERRORCODE"
                value={form.ERRORCODE}
                onChange={handleChange}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Label for="ERRORSOURCE">Fuente</Label>
              <Input
                id="ERRORSOURCE"
                name="ERRORSOURCE"
                value={form.ERRORSOURCE}
                onChange={handleChange}
              />
            </div>
          </FlexBox>

          {/* Módulo, Severidad y Estatus */}
          <FlexBox direction={FlexBoxDirection.Row} style={{ gap: "1rem" }}>
            <div style={{ flex: 1 }}>
              <Label for="MODULE">Módulo</Label>
              <Input
                id="MODULE"
                name="MODULE"
                value={form.MODULE}
                onChange={handleChange}
              />
            </div>

            <div style={{ flex: 1 }}>
              <Label for="SEVERITY">Severidad</Label>
              <Select
                id="SEVERITY"
                name="SEVERITY"
                value={form.SEVERITY}
                onChange={handleChange}
              >
                {["INFO", "WARNING", "ERROR", "CRITICAL"].map((s) => (
                  <Option key={s}>{s}</Option>
                ))}
              </Select>
            </div>

            <div style={{ flex: 1 }}>
              <Label for="STATUS">Estatus</Label>
              <Select
                id="STATUS"
                name="STATUS"
                value={form.STATUS}
                onChange={handleChange}
              >
                {["NEW", "IN_PROGRESS", "RESOLVED", "IGNORED"].map((s) => (
                  <Option key={s}>{s}</Option>
                ))}
              </Select>
            </div>
          </FlexBox>
        </FlexBox>

        {/* Acciones */}
        <FlexBox
          direction={FlexBoxDirection.Row}
          style={{
            justifyContent: "flex-end",
            gap: "0.5rem",
            marginTop: "1.5rem",
          }}
        >
          <Button design="Transparent" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button design="Emphasized" type="submit">
            {initialValue ? "Guardar" : "Crear"}
          </Button>
        </FlexBox>
      </form>
    </Dialog>
  );
}
