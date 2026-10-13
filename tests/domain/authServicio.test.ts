import { describe, it, expect } from 'vitest';
import {
  validarCredenciales,
  mapearErrorAuth,
} from '../../src/domain/models/auth.ts';

describe('Dominio de Autenticación: Validaciones y Mapeo de Errores', () => {
  describe('validarCredenciales', () => {
    it('falla si el email está vacío o solo contiene espacios', () => {
      const res = validarCredenciales({ email: '   ', password: 'password123' });
      expect(res.valido).toBe(false);
      expect(res.error).toBe('Ingresá tu correo electrónico.');
    });

    it('falla si el email no tiene formato válido', () => {
      const res = validarCredenciales({ email: 'caro-sin-arroba', password: 'password123' });
      expect(res.valido).toBe(false);
      expect(res.error).toBe('Ingresá un correo electrónico válido.');
    });

    it('falla si la contraseña está vacía', () => {
      const res = validarCredenciales({ email: 'caro@lodecaro.com', password: '' });
      expect(res.valido).toBe(false);
      expect(res.error).toBe('Ingresá tu contraseña.');
    });

    it('pasa exitosamente cuando email y contraseña son válidos', () => {
      const res = validarCredenciales({ email: 'caro@lodecaro.com', password: 'mi-clave-segura' });
      expect(res.valido).toBe(true);
      expect(res.error).toBeUndefined();
    });

    it('maneja con seguridad valores null o undefined sin lanzar excepción', () => {
      const resNull = validarCredenciales(null);
      expect(resNull.valido).toBe(false);
      expect(resNull.error).toBe('Ingresá tu correo electrónico.');

      const resUndef = validarCredenciales(undefined);
      expect(resUndef.valido).toBe(false);
      expect(resUndef.error).toBe('Ingresá tu correo electrónico.');
    });

    it('acepta y valida correctamente correos con mayúsculas y espacios externos', () => {
      const res = validarCredenciales({ email: '   CARO@LODECARO.COM   ', password: 'password123' });
      expect(res.valido).toBe(true);
      expect(res.error).toBeUndefined();
    });
  });

  describe('mapearErrorAuth', () => {
    it('traduce credenciales inválidas de Supabase a un mensaje amigable en español', () => {
      const err = new Error('Invalid login credentials');
      expect(mapearErrorAuth(err)).toBe('El correo electrónico o la contraseña son incorrectos.');
    });

    it('traduce error de usuario no encontrado al mismo mensaje seguro de credenciales inválidas', () => {
      const err = new Error('User not found');
      expect(mapearErrorAuth(err)).toBe('El correo electrónico o la contraseña son incorrectos.');
    });

    it('traduce error de correo no confirmado', () => {
      const err = new Error('Email not confirmed');
      expect(mapearErrorAuth(err)).toBe('El correo electrónico aún no fue confirmado.');
    });

    it('traduce límites de tasa o demasiados intentos fallidos (429 / rate limit)', () => {
      expect(mapearErrorAuth(new Error('Email rate limit exceeded'))).toBe(
        'Demasiados intentos fallidos. Por favor, esperá unos minutos antes de volver a intentar.'
      );
      expect(mapearErrorAuth(new Error('Too many requests'))).toBe(
        'Demasiados intentos fallidos. Por favor, esperá unos minutos antes de volver a intentar.'
      );
      expect(mapearErrorAuth({ message: 'Request failed with status code 429' })).toBe(
        'Demasiados intentos fallidos. Por favor, esperá unos minutos antes de volver a intentar.'
      );
    });

    it('traduce problemas de conexión o fallas de red', () => {
      const err = new Error('Failed to fetch');
      expect(mapearErrorAuth(err)).toBe('No se pudo conectar con el servidor. Revisá tu conexión a internet.');
    });

    it('retorna mensaje predeterminado si es un error desconocido', () => {
      const err = new Error('Some internal unhandled error');
      expect(mapearErrorAuth(err)).toBe('Ocurrió un error al intentar iniciar sesión. Por favor, probá de nuevo.');
    });

    it('maneja strings o valores que no son instancias de Error', () => {
      expect(mapearErrorAuth('Error inesperado')).toBe('Ocurrió un error al intentar iniciar sesión. Por favor, probá de nuevo.');
      expect(mapearErrorAuth(null)).toBe('Ocurrió un error al intentar iniciar sesión. Por favor, probá de nuevo.');
    });
  });
});
