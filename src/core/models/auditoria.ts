/**
 * Rastro de auditoría del sistema (CU-08). Los valores coinciden con los enums
 * y las respuestas del backend.
 */
export const OperacionAuditoria = {
  INSERT: 'INSERT',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
} as const;

export type OperacionAuditoria =
  (typeof OperacionAuditoria)[keyof typeof OperacionAuditoria];

/** Etiqueta de presentación de la operación, en español. */
export const operacionLabel = (operacion: OperacionAuditoria): string =>
  ({
    INSERT: 'Creación',
    UPDATE: 'Modificación',
    DELETE: 'Eliminación',
  })[operacion];

export interface AutorEvento {
  idUsuario: number;
  email: string;
}

export interface EventoAuditoria {
  idLogAuditoria: string;
  fecha: string;
  usuario: AutorEvento | null;
  tabla: string;
  registroId: number;
  operacion: OperacionAuditoria;
  valorAnterior: unknown;
  valorNuevo: unknown;
  ip: string | null;
}

export interface EventoAcceso {
  idBitacoraAcceso: number;
  fecha: string;
  usuario: AutorEvento | null;
  exitoso: boolean;
  ip: string;
}

export interface PaginaAuditoria<T> {
  total: number;
  pagina: number;
  limite: number;
  registros: T[];
}

export interface FiltrosAuditoria {
  idUsuario?: number;
  tabla?: string;
  operacion?: OperacionAuditoria;
  desde?: string;
  hasta?: string;
  limite?: number;
  pagina?: number;
}

export interface FiltrosAccesos {
  idUsuario?: number;
  exitoso?: boolean;
  desde?: string;
  hasta?: string;
  limite?: number;
  pagina?: number;
}
