/**
 * Modelo de Dominio para la Autenticación y Control de Acceso.
 */

export interface Usuario {
  id: string;
  email: string;
}

export interface CredencialesLogin {
  email: string;
  password: string;
}

export interface ResultadoValidacionCredenciales {
  valido: boolean;
  error?: string;
}

/**
 * Valida localmente el formato y presencia de las credenciales antes de enviarlas al servidor.
 */
export function validarCredenciales(credenciales?: CredencialesLogin | null): ResultadoValidacionCredenciales {
  if (!credenciales) {
    return { valido: false, error: 'Ingresá tu correo electrónico.' };
  }

  const emailLimpio = credenciales.email?.trim().toLowerCase() || '';
  const passwordLimpio = credenciales.password || '';

  if (!emailLimpio) {
    return { valido: false, error: 'Ingresá tu correo electrónico.' };
  }

  // Regex simple y robusto de validación de formato de email
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regexEmail.test(emailLimpio)) {
    return { valido: false, error: 'Ingresá un correo electrónico válido.' };
  }

  if (!passwordLimpio) {
    return { valido: false, error: 'Ingresá tu contraseña.' };
  }

  return { valido: true };
}

/**
 * Traduce excepciones técnicas o códigos de error de Supabase Auth a mensajes en español claros para el usuario.
 */
export function mapearErrorAuth(error: unknown): string {
  if (!error) {
    return 'Ocurrió un error al intentar iniciar sesión. Por favor, probá de nuevo.';
  }

  const mensaje =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : String(error);

  const mensajeNormalizado = mensaje.toLowerCase();

  if (
    mensajeNormalizado.includes('invalid login credentials') ||
    mensajeNormalizado.includes('invalid grant') ||
    mensajeNormalizado.includes('invalid_grant') ||
    mensajeNormalizado.includes('user not found') ||
    mensajeNormalizado.includes('user_not_found')
  ) {
    return 'El correo electrónico o la contraseña son incorrectos.';
  }

  if (
    mensajeNormalizado.includes('email not confirmed') ||
    mensajeNormalizado.includes('email_not_confirmed')
  ) {
    return 'El correo electrónico aún no fue confirmado.';
  }

  if (
    mensajeNormalizado.includes('rate limit') ||
    mensajeNormalizado.includes('too many requests') ||
    mensajeNormalizado.includes('429') ||
    mensajeNormalizado.includes('over_email_send_rate_limit')
  ) {
    return 'Demasiados intentos fallidos. Por favor, esperá unos minutos antes de volver a intentar.';
  }

  if (
    mensajeNormalizado.includes('failed to fetch') ||
    mensajeNormalizado.includes('networkerror') ||
    mensajeNormalizado.includes('network error')
  ) {
    return 'No se pudo conectar con el servidor. Revisá tu conexión a internet.';
  }

  return 'Ocurrió un error al intentar iniciar sesión. Por favor, probá de nuevo.';
}
