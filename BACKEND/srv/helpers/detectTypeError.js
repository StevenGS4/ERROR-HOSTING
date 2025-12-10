/**
 * Detecta el tipo de error basado en patrones de texto (Regex)
 * @param {string|object} error - El mensaje de error o el objeto de error
 * @returns {string} - El valor del ENUM TYPE_ERROR
 */
export const detectTypeError = (error) => {
  // 1. Convertir a string y minúsculas para facilitar la búsqueda
  const msg = (
    typeof error === "string" ? error : error?.message || JSON.stringify(error)
  ).toLowerCase();

  // 2. Definición de reglas (El orden IMPORTA: de más específico a más general)
  const rules = [
    {
      type: "SEGURIDAD",
      keywords: [
        "cors",
        "cross-origin",
        "xss",
        "attack",
        "vulnerability",
        "ssl",
        "tls",
        "certificate",
      ],
    },
    {
      type: "AUTH",
      keywords: [
        "unauthorized",
        "forbidden",
        "401",
        "403",
        "jwt",
        "token",
        "expired",
        "denied",
        "credenciales",
        "autenticacion",
        "permisos",
      ],
    },
    {
      type: "VALIDACION",
      keywords: [
        "validation failed", // Mongoose
        "is required", // Mongoose
        "cast to", // Mongoose (CastError)
        "invalid format",
        "should not be empty",
        "must be",
        "validator",
        "zterrorlog validation failed", // Tu caso específico
      ],
    },
    {
      type: "INTEGRACION",
      keywords: [
        "axios",
        "fetch",
        "http request",
        "api call",
        "soap",
        "rest",
        "endpoint",
        "econnrefused",
        "timeout",
        "network error",
      ],
    },
    {
      type: "DATABASE",
      keywords: [
        "mongo",
        "mongoose",
        "duplicate key", // E11000
        "e11000",
        "sql",
        "connection",
        "topology",
        "timeout",
        "pool",
        "query",
      ],
    },
    {
      type: "INFRAESTRUCTURA",
      keywords: [
        "disk space",
        "memory",
        "cpu",
        "out of memory",
        "heap",
        "shutdown",
        "reboot",
        "azure",
        "aws",
        "docker",
        "kubernetes",
      ],
    },
    {
      type: "LOGICO",
      keywords: [
        "undefined is not a function",
        "cannot read property",
        "null",
        "undefined",
        "referenceerror",
        "typeerror",
        "syntaxerror",
      ],
    },
    {
      type: "SERVIDOR",
      keywords: ["500", "internal server error", "server error", "crash"],
    },
  ];

  // 3. Iterar y buscar coincidencias
  for (const rule of rules) {
    // Usamos .some() para ver si alguna de las palabras clave está en el mensaje
    if (rule.keywords.some((keyword) => msg.includes(keyword))) {
      return rule.type;
    }
  }

  // 4. Fallback por defecto si no detecta nada específico
  return "OTRO"; // O podrías devolver "SERVIDOR" si prefieres ser pesimista
};
