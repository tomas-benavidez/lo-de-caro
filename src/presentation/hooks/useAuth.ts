import { useState, useEffect, useCallback } from 'react';
import {
  Usuario,
  CredencialesLogin,
  validarCredenciales,
} from '../../domain/models/auth.ts';
import {
  AuthRepositorio,
  authRepositorio as authRepoPorDefecto,
} from '../../infrastructure/repositories/authRepositorio.ts';

export interface UseAuthResultado {
  usuario: Usuario | null;
  cargandoSesion: boolean;
  errorAuth: string | null;
  iniciarSesion: (credenciales: CredencialesLogin) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  limpiarError: () => void;
}

/**
 * Hook de aplicación que orquesta el estado de la sesión, la carga inicial y las acciones de login/logout.
 */
export function useAuth(
  authRepo: AuthRepositorio = authRepoPorDefecto
): UseAuthResultado {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargandoSesion, setCargandoSesion] = useState<boolean>(true);
  const [errorAuth, setErrorAuth] = useState<string | null>(null);

  useEffect(() => {
    let montado = true;

    // 1. Verificar sesión persistida existente
    authRepo
      .obtenerSesion()
      .then((sesionActiva) => {
        if (montado) {
          setUsuario(sesionActiva);
          setCargandoSesion(false);
        }
      })
      .catch(() => {
        if (montado) {
          setUsuario(null);
          setCargandoSesion(false);
        }
      });

    // 2. Escuchar cambios de autenticación en tiempo real (login, logout, token refresh)
    const desuscribir = authRepo.alCambiarEstadoAuth((usuarioActualizado) => {
      if (montado) {
        setUsuario(usuarioActualizado);
        setCargandoSesion(false);
      }
    });

    return () => {
      montado = false;
      desuscribir();
    };
  }, [authRepo]);

  const iniciarSesion = useCallback(
    async (credenciales: CredencialesLogin): Promise<void> => {
      setErrorAuth(null);

      // Validación previa de formato
      const validacion = validarCredenciales(credenciales);
      if (!validacion.valido) {
        const mensaje = validacion.error ?? 'Credenciales inválidas.';
        setErrorAuth(mensaje);
        throw new Error(mensaje);
      }

      try {
        const usuarioAutenticado = await authRepo.iniciarSesion(credenciales);
        setUsuario(usuarioAutenticado);
      } catch (err) {
        const mensaje =
          err instanceof Error
            ? err.message
            : 'No se pudo iniciar sesión. Por favor, verificá tus datos.';
        setErrorAuth(mensaje);
        throw err;
      }
    },
    [authRepo]
  );

  const cerrarSesion = useCallback(async (): Promise<void> => {
    setErrorAuth(null);
    try {
      await authRepo.cerrarSesion();
    } catch (err) {
      const mensaje =
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al cerrar la sesión.';
      setErrorAuth(mensaje);
    } finally {
      // Siempre garantizar que la sesión local quede eliminada
      setUsuario(null);
    }
  }, [authRepo]);

  const limpiarError = useCallback(() => {
    setErrorAuth(null);
  }, []);

  return {
    usuario,
    cargandoSesion,
    errorAuth,
    iniciarSesion,
    cerrarSesion,
    limpiarError,
  };
}
