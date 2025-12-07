# BACKEND
- CAP + Express + Mongo
- OData /odata/v4/error
- REST /api/v1/zterrorlog



# 📘 Error Hosting API – Documentación de Endpoints

Base URL: `https://error-hosting.onrender.com`

## 1. Healthcheck
### GET /health
Verifica el estado del servicio.

## 2. OData Root
### GET /odata/v4/
Listado de servicios OData.

## 3. CRUD Completo
Endpoint general:
`POST /odata/v4/api/error/crud`

### Insertar Error
POST `/odata/v4/api/error/crud?queryType=add&LoggedUser=TEST&dbServer=MongoDB`

Body:
```json
{
  "data": {
    "ERRORMESSAGE": "Error al procesar la venta: stock insuficiente.",
    "ERRORDATETIME": "2025-11-26T21:47:56.036Z",
    "ERRORCODE": "STOCK_001",
    "ERRORSOURCE": "VentaController.js",
    "ERRORID": "1764193676038",
    "CANSEEUSERS": ["admin", "soporte"],
    "ASIGNEDUSERS": ["ramses"],
    "COMMENTS": [
      {
        "user": "ramses",
        "msg": "Revisando problema.",
        "timestamp": "2025-11-26T21:47:56.038Z"
      }
    ],
    "USER_SESSION_LOG": [
      "login_success",
      "view_products",
      "attempt_sale"
    ],
    "CONTEXT": [
      {
        "stack": "TypeError: Cannot read property 'cantidad' of undefined",
        "endponint": "/ventas/nueva",
        "requestBody": { "producto": 5, "cantidad": 10 },
        "browser": { "name": "Chrome", "version": "120" },
        "errorMessageRaw": "No se encontró el producto solicitado.",
        "stackTrace": ["line 20", "line 55"],
        "component": "NuevaVenta",
        "function": "validarStock",
        "httpRequest": { "method": "POST", "url": "/ventas/nueva" },
        "timestamp": "2025-11-26T21:47:56.038Z"
      }
    ],
    "STATUS": "NEW",
    "SEVERITY": "ERROR",
    "TYPE_ERROR": "NEGOCIO",
    "MODULE": "Ventas",
    "APPLICATION": "PuntoVentaApp",
    "CREATED_BY_APP": "POS",
    "PROCESS": "Validación de stock",
    "ENVIRONMENT": "DEV",
    "DEVICE": "Windows 10"
  }
}
```

### Obtener todos
POST `/odata/v4/api/error/crud?queryType=getAll&LoggedUser=TEST&dbServer=MongoDB`

### Obtener uno
POST `/odata/v4/api/error/crud?queryType=getOne&LoggedUser=TEST&dbServer=MongoDB`

Body:
```json
{ "data": { "_id": "ID_DE_MONGO" } }
```

### Actualizar
POST `/odata/v4/api/error/crud?queryType=update&LoggedUser=TEST&dbServer=MongoDB`

### Eliminar
POST `/odata/v4/api/error/crud?queryType=delete&LoggedUser=TEST&dbServer=MongoDB`

---

## 4. Auto-Assign
POST `/api/error/autoAssign`

Body:
```json
{}
```

---

## 5. Asignación Manual
POST `/api/error/assign`

```json
{
  "errorId": "1764193676038",
  "assignedUser": "ramses",
  "assignedBy": "admin"
}
```

---

## 6. IA Gemini – Sugerencias
GET `/api/error/ai-suggestion/:id`

---

## 7. Rutas Legacy
`/zterrorlog/crud` → redirige a `/odata/v4/api/error/crud`

