import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthRepositorio } from '../../src/infrastructure/repositories/authRepositorio.ts';
import { SupabaseClient } from '@supabase/supabase-js';

describe('AuthRepositorio (Infraestructura)', () => {
  let mockSupabase: any;
  let authRepositorio: AuthRepositorio;

  beforeEach(() => {
    mockSupabase = {
      auth: {
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
        getSession: vi.fn(),
        onAuthStateChange: vi.fn(),
      },
    };
    authRepositorio = new AuthRepositorio(mockSupabase as unknown as SupabaseClient);
  });

  describe('iniciarSesion', () => {
    it('inicia sesión exitosamente y retorna el usuario mapeado', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user: { id: 'usr-123', email: 'caro@lodecaro.com' },
          session: { access_token: 'fake-jwt' },
        },
        error: null,
      });

      const usuario = await authRepositorio.iniciarSesion({
        email: '  caro@lodecaro.com  ',
        password: 'password123',
      });

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'caro@lodecaro.com',
        password: 'password123',
      });
      expect(usuario).toEqual({
        id: 'usr-123',
        email: 'caro@lodecaro.com',
      });
    });

    it('lanza un error traducido cuando Supabase devuelve credenciales inválidas', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials', status: 400 },
      });

      await expect(
        authRepositorio.iniciarSesion({
          email: 'caro@lodecaro.com',
          password: 'incorrecta',
        })
      ).rejects.toThrow('El correo electrónico o la contraseña son incorrectos.');
    });

    it('lanza un error si Supabase no devuelve usuario ni error', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: null,
      });

      await expect(
        authRepositorio.iniciarSesion({
          email: 'caro@lodecaro.com',
          password: 'password123',
        })
      ).rejects.toThrow('No se pudo obtener la información de usuario.');
    });
  });

  describe('cerrarSesion', () => {
    it('cierra sesión correctamente invocando signOut()', async () => {
      mockSupabase.auth.signOut.mockResolvedValueOnce({ error: null });

      await authRepositorio.cerrarSesion();

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it('lanza error si signOut falla', async () => {
      mockSupabase.auth.signOut.mockResolvedValueOnce({
        error: { message: 'Failed to sign out' },
      });

      await expect(authRepositorio.cerrarSesion()).rejects.toThrow();
    });
  });

  describe('obtenerSesion', () => {
    it('retorna el usuario cuando existe una sesión activa', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: {
          session: {
            user: { id: 'usr-999', email: 'caro@lodecaro.com' },
          },
        },
        error: null,
      });

      const usuario = await authRepositorio.obtenerSesion();

      expect(usuario).toEqual({
        id: 'usr-999',
        email: 'caro@lodecaro.com',
      });
    });

    it('retorna null cuando no hay sesión activa', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      const usuario = await authRepositorio.obtenerSesion();

      expect(usuario).toBeNull();
    });

    it('retorna null si getSession falla', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: { message: 'Network error' },
      });

      const usuario = await authRepositorio.obtenerSesion();

      expect(usuario).toBeNull();
    });
  });

  describe('alCambiarEstadoAuth', () => {
    it('suscribe el callback a onAuthStateChange y permite desuscribirse', () => {
      const unsubscribeMock = vi.fn();
      mockSupabase.auth.onAuthStateChange.mockReturnValueOnce({
        data: {
          subscription: {
            unsubscribe: unsubscribeMock,
          },
        },
      });

      const callback = vi.fn();
      const desuscribir = authRepositorio.alCambiarEstadoAuth(callback);

      expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled();
      desuscribir();
      expect(unsubscribeMock).toHaveBeenCalled();
    });

    it('notifica al callback con el usuario cuando la sesión cambia', () => {
      let listenerInterno: any = null;
      mockSupabase.auth.onAuthStateChange.mockImplementationOnce((cb: any) => {
        listenerInterno = cb;
        return {
          data: {
            subscription: { unsubscribe: vi.fn() },
          },
        };
      });

      const callback = vi.fn();
      authRepositorio.alCambiarEstadoAuth(callback);

      // Simular evento SIGNED_IN
      listenerInterno('SIGNED_IN', {
        user: { id: 'usr-1', email: 'test@lodecaro.com' },
      });
      expect(callback).toHaveBeenCalledWith({
        id: 'usr-1',
        email: 'test@lodecaro.com',
      });

      // Simular evento SIGNED_OUT
      listenerInterno('SIGNED_OUT', null);
      expect(callback).toHaveBeenCalledWith(null);
    });

    it('asigna string vacío si el usuario de la sesión no tiene email en onAuthStateChange', () => {
      let listenerInterno: any = null;
      mockSupabase.auth.onAuthStateChange.mockImplementationOnce((cb: any) => {
        listenerInterno = cb;
        return {
          data: {
            subscription: { unsubscribe: vi.fn() },
          },
        };
      });

      const callback = vi.fn();
      authRepositorio.alCambiarEstadoAuth(callback);

      listenerInterno('USER_UPDATED', {
        user: { id: 'usr-sin-email', email: null },
      });
      expect(callback).toHaveBeenCalledWith({
        id: 'usr-sin-email',
        email: '',
      });
    });
  });

  describe('casos de borde adicionales de infraestructura', () => {
    it('normaliza a minúsculas y remueve espacios en iniciarSesion', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user: { id: 'usr-lower', email: 'caro@lodecaro.com' },
        },
        error: null,
      });

      await authRepositorio.iniciarSesion({
        email: '   CARO@LODECARO.COM   ',
        password: 'password123',
      });

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'caro@lodecaro.com',
        password: 'password123',
      });
    });

    it('retorna null cuando getSession lanza una excepción inesperada (reject)', async () => {
      mockSupabase.auth.getSession.mockRejectedValueOnce(new Error('Fatal connection crash'));

      const sesion = await authRepositorio.obtenerSesion();
      expect(sesion).toBeNull();
    });
  });
});
