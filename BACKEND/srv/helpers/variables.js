// srv/config/variables.js
/**
 * Función utilitaria: identifica el tipo de variable
 */
export const whatTypeVarIs = (variable) => {
  if (Array.isArray(variable)) return 'isArray';
  if (typeof variable === 'object' && variable !== null) return 'isObject';
  return null;
};

/**
 * Constantes globales del proyecto
 */
export const APP_NAME = 'Error Manager';
export const APP_VERSION = '1.0.0'; // opcional
export const APP_ENV = process.env.NODE_ENV || 'development';
