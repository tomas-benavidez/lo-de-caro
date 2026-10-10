export interface Cliente {
  id: string;
  nombreApellido: string;
  telefono?: string | null;
  saldoPendiente: number;
  fechaCreacion?: string;
}

export interface NuevoClienteInput {
  nombreApellido: string;
  telefono?: string | null;
}

export interface RegistroPagoClienteInput {
  clienteId: string;
  monto: number;
  metodoPago: 'Efectivo' | 'Transferencia';
  observaciones?: string;
}
