import React from "react";
import {
  Table,
  TableColumn,
  TableRow,
  TableCell,
  Button,
  Text,
  BusyIndicator
} from "@ui5/webcomponents-react";

export default function ErrorTable({ items = [], loading, onSelect, onEdit }) {
  // 🔹 Mantener los mismos mensajes de carga y vacíos
  if (loading) {
    return (
      <div style={{ padding: "1rem", textAlign: "center" }}>
        <BusyIndicator active size="Large" />
        <p>Cargando...</p>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div style={{ padding: "1rem", textAlign: "center" }}>
        <Text>No hay errores.</Text>
      </div>
    );
  }

  return (
    <div style={{ margin: "1rem" }}>
      <Table
        noDataText="No hay errores registrados"
        stickyColumnHeader
        style={{ width: "100%" }}
      >
        {/* 🔹 Encabezados */}
        <TableColumn>
          <Text>Fecha</Text>
        </TableColumn>
        <TableColumn>
          <Text>Módulo</Text>
        </TableColumn>
        <TableColumn>
          <Text>Severidad</Text>
        </TableColumn>
        <TableColumn>
          <Text>Mensaje</Text>
        </TableColumn>
        <TableColumn>
          <Text>Estatus</Text>
        </TableColumn>
        <TableColumn>
          <Text>Acciones</Text>
        </TableColumn>

        {/* 🔹 Filas dinámicas */}
        {items.map((row) => (
          <TableRow
            key={String(row._id)}
            onClick={() => onSelect?.(row)}
            style={{ cursor: "pointer" }}
          >
            <TableCell>
              <Text>
                {row.ERRORDATETIME
                  ? new Date(row.ERRORDATETIME).toLocaleString()
                  : "-"}
              </Text>
            </TableCell>
            <TableCell>
              <Text>{row.MODULE}</Text>
            </TableCell>
            <TableCell>
              <Text>{row.SEVERITY}</Text>
            </TableCell>
            <TableCell title={row.ERRORMESSAGE}>
              <Text>{row.ERRORMESSAGE?.slice(0, 50)}…</Text>
            </TableCell>
            <TableCell>
              <Text>{row.STATUS}</Text>
            </TableCell>
            <TableCell>
              <Button
                design="Emphasized"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(row);
                }}
              >
                Editar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  );
}
