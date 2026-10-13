import { SupabaseClient } from '@supabase/supabase-js';
import { supabase as clientePorDefecto } from '../supabase/cliente.ts';
import {
  Usuario,
  CredencialesLogin,
  mapearErrorAuth,
} from '../../domain/models/auth.ts';

/**
 * Repositorio de infraestructura para la gestión de autenticación sobre Supabase Auth.
 */
export class AuthRepositorio {
  constructor(private cliente: SupabaseClient = clientePorDefecto) {}

  /**
   * Inicia sesión con correo electrónico y contraseña.
   */
  async iniciarSesion(credenciales: CredencialesLogin): Promise<Usuario> {
    const emailLimpio = credenciales.email.trim().toLowerCase();
    const password = credenciales.password;

    const { data, error } = await this.cliente.auth.signInWithPassword({
      email: emailLimpio,
      password,
    });

    if (error) {
      throw new Error(mapearErrorAuth(error));
    }

    if (!data.user) {
      throw new Error('No se pudo obtener la información de usuario.');
    }

    return {
      id: data.user.id,
      email: data.user.email ?? emailLimpio,
    };
  }

  /**
   * Cierra la sesión activa actual.
   */
  async cerrarSesion(): Promise<void> {
    const { error } = await this.cliente.auth.signOut();
    if (error) {
      throw new Error(mapearErrorAuth(error));
    }
  }

  /**
   * Obtiene la sesión activa persistida en el navegador si existe.
   */
  async obtenerSesion(): Promise<Usuario | null> {
    try {
      const { data, error } = await this.cliente.auth.getSession();
      if (error || !data.session?.user) {
        return null;
      }

      return {
        id: data.session.user.id,
        email: data.session.user.email ?? '',
      };
    } catch {
      return null;
    }
  }

  /**
   * Se suscribe a los cambios de estado de autenticación (login, logout, refresh de token).
   * Retorna una función para cancelar la suscripción (cleanup).
   */
  alCambiarEstadoAuth(callback: (usuario: Usuario | null) => void): () => void {
    const { data } = this.cliente.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        callback({
          id: session.user.id,
          email: session.user.email ?? '',
        });
      } else {
        callback(null);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }
}

/**
 * Instancia singleton para uso en toda la aplicación.
 */
export const authRepositorio = new AuthRepositorio();
