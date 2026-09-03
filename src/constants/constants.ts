export const Constants = {
  Error: {
    AUTHORIZATION_HEADER_NOT_PROVIDED: 'Authorization header not provided',
    AUTHORIZATION_HEADER_INVALID_FORMAT: 'Authorization header must be: Bearer <token>',
    AUTHORIZATION_TOKEN_INVALID: 'Token inválido o expirado',
    INVALID_CREDENTIALS: 'Usuario o contraseña incorrectos',
    USER_NOT_FOUND: 'Usuario no encontrado',
    USER_INACTIVE: 'Usuario sin acceso al sistema',
    INTERNAL_SERVER_ERROR: 'Error interno del servidor',
  },
  Auth: {
    EMAIL_DOMAIN: 'tecnologiaspine.com',
    PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
    PASSWORD_REGEX_MESSAGE: 'La contraseña debe incluir mayúsculas, minúsculas, un número y un carácter especial',
  },
};
