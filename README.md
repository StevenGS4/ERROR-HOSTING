# PETICION API ADDERROR

POST http://localhost:3333/api/users/crud?ProcessType=postUsuario&DBServer=MongoDB&LoggedUser=SYSTEM](http://localhost:3334/odata/v4/api/error/crud?queryType=add&LoggedUser=RRG&dbServer=azure

{
    "data": {
        "ERRORDATETIME": "2025-09-25T14:12:00.000Z",
        "ERRORMESSAGE" :  "ERROR EN MENSAJERIA",
        "ERRORCODE": "REFERENCE_ERROR",
        "ERR": "REFERENCE_ERROR",
        "ERRORSOURCE": "FRONTEND",
        "CONTEXT": {
            "stack": "ReferenceError: fetchData is not defined\n    at useEffect (Dashboard.js:27:9)\n    at commitHookEffectListMount (react-dom.development.js:23150:30)",
            "endpoint": "/api/dashboard/data",
            "requestBody": {},
            "browser": "Firefox 125",
            "os": "Ubuntu 22.04"
        },
        "SEVERITY": "ERROR",
        "MODULE": "errores",
        "APPLICATION": "frontend-web",
        "USER": "64f6c8b8d1a8a91234567891"
    }
}

====================================================================
CREAR USUARIO (POST)
POST http://localhost:3333/api/users/crud?ProcessType=postUsuario&DBServer=MongoDB&LoggedUser=SYSTEM

ASIGNAR ROL (POST)
POST http://localhost:3333/api/users/crud?ProcessType=assignRol&DBServer=MongoDB&LoggedUser=SYSTEM
====================================================================


====================================================================
USUARIO 1 — GSTE
====================================================================

--- Crear usuario ---
{
  "usuario": {
    "USERID": "GSTE",
    "USERNAME": "Gilmar Specter",
    "COMPANYID": 1000,
    "CEDIID": 2001,
    "EMPLOYEEID": 123456,
    "EMAIL": "gilmar@errormanager.com",
    "ALIAS": "Gilmar",
    "PHONENUMBER": "+15551234567",
    "EXTENSION": "x789",
    "DETAIL_ROW": {
      "ACTIVED": true,
      "DELETED": false,
      "DETAIL_ROW_REG": [{
        "CURRENT": true,
        "REGDATE": "2025-11-20T00:00:00.000Z",
        "REGTIME": "12:00:00",
        "REGUSER": "SYSTEM"
      }]
    }
  }
}

--- Asignar rol ---
{
  "usuario": {
    "USERID": "GSTE",
    "ROLEID": "developer"
  }
}



====================================================================
USUARIO 2 — DEVPROD01
====================================================================

--- Crear usuario ---
{
  "usuario": {
    "USERID": "DEVPROD01",
    "USERNAME": "Carlos Ramirez",
    "EMAIL": "carlos.ramirez@empresa.com",
    "COMPANYID": 1000,
    "CEDIID": 2001,
    "EMPLOYEEID": 9001,
    "ALIAS": "Carlos",
    "PHONENUMBER": "+521555000001",
    "EXTENSION": "1001",
    "DETAIL_ROW": {
      "ACTIVED": true,
      "DELETED": false,
      "DETAIL_ROW_REG": [{
        "CURRENT": true,
        "REGDATE": "2025-11-20T00:00:00.000Z",
        "REGTIME": "12:00:00",
        "REGUSER": "SYSTEM"
      }]
    }
  }
}

--- Asignar rol ---
{
  "usuario": {
    "USERID": "DEVPROD01",
    "ROLEID": "dev.productos"
  }
}



====================================================================
USUARIO 3 — DEVPROD02
====================================================================

--- Crear usuario ---
{
  "usuario": {
    "USERID": "DEVPROD02",
    "USERNAME": "Luis Ortega",
    "EMAIL": "luis.ortega@empresa.com",
    "COMPANYID": 1000,
    "CEDIID": 2001,
    "EMPLOYEEID": 9002,
    "ALIAS": "Ortega",
    "PHONENUMBER": "+521555000002",
    "EXTENSION": "1002",
    "DETAIL_ROW": {
      "ACTIVED": true,
      "DELETED": false,
      "DETAIL_ROW_REG": [{
        "CURRENT": true,
        "REGDATE": "2025-11-20T00:00:00.000Z",
        "REGTIME": "12:00:00",
        "REGUSER": "SYSTEM"
      }]
    }
  }
}

--- Asignar rol ---
{
  "usuario": {
    "USERID": "DEVPROD02",
    "ROLEID": "dev.productos"
  }
}



====================================================================
USUARIO 4 — JEFEPROD
====================================================================

--- Crear usuario ---
{
  "usuario": {
    "USERID": "JEFEPROD",
    "USERNAME": "Marcos Villanueva",
    "EMAIL": "marcos.villanueva@empresa.com",
    "COMPANYID": 1000,
    "CEDIID": 2001,
    "EMPLOYEEID": 8001,
    "ALIAS": "Marcos",
    "PHONENUMBER": "+521555000003",
    "EXTENSION": "2001",
    "DETAIL_ROW": {
      "ACTIVED": true,
      "DELETED": false,
      "DETAIL_ROW_REG": [{
        "CURRENT": true,
        "REGDATE": "2025-11-20T00:00:00.000Z",
        "REGTIME": "12:00:00",
        "REGUSER": "SYSTEM"
      }]
    }
  }
}

--- Asignar rol (1) ---
{
  "usuario": {
    "USERID": "JEFEPROD",
    "ROLEID": "jefe.productos"
  }
}

--- Asignar rol (2) ---
{
  "usuario": {
    "USERID": "JEFEPROD",
    "ROLEID": "dev.productos"
  }
}



====================================================================
USUARIO 5 — USRERROR01
====================================================================

--- Crear usuario ---
{
  "usuario": {
    "USERID": "USRERROR01",
    "USERNAME": "Daniel Morales",
    "EMAIL": "daniel.morales@empresa.com",
    "COMPANYID": 1000,
    "CEDIID": 2001,
    "EMPLOYEEID": 7001,
    "ALIAS": "Daniel",
    "PHONENUMBER": "+521555100001",
    "EXTENSION": "3001",
    "DETAIL_ROW": {
      "ACTIVED": true,
      "DELETED": false,
      "DETAIL_ROW_REG": [{
        "CURRENT": true,
        "REGDATE": "2025-11-20T00:00:00.000Z",
        "REGTIME": "12:00:00",
        "REGUSER": "SYSTEM"
      }]
    }
  }
}

--- Asignar rol ---
{
  "usuario": {
    "USERID": "USRERROR01",
    "ROLEID": "usuario.final"
  }
}



====================================================================
USUARIO 6 — USRERROR02
====================================================================

--- Crear usuario ---
{
  "usuario": {
    "USERID": "USRERROR02",
    "USERNAME": "Andrea Lopez",
    "EMAIL": "andrea.lopez@empresa.com",
    "COMPANYID": 1000,
    "CEDIID": 2001,
    "EMPLOYEEID": 7002,
    "ALIAS": "Andrea",
    "PHONENUMBER": "+521555100002",
    "EXTENSION": "3002",
    "DETAIL_ROW": {
      "ACTIVED": true,
      "DELETED": false,
      "DETAIL_ROW_REG": [{
        "CURRENT": true,
        "REGDATE": "2025-11-20T00:00:00.000Z",
        "REGTIME": "12:00:00",
        "REGUSER": "SYSTEM"
      }]
    }
  }
}

--- Asignar rol ---
{
  "usuario": {
    "USERID": "USRERROR02",
    "ROLEID": "usuario.final"
  }
}


====================================================================
FIN DEL BACKUP DE USUARIOS + ROLES
====================================================================

