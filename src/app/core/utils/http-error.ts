import { HttpErrorResponse } from '@angular/common/http';
import { ErrorResponse } from '../models/error-response';

export function mensajeError(err: HttpErrorResponse): string {
  if (err.status === 0) {
    return 'No se pudo conectar con el servidor. Verifique que el backend esté en ejecución y que CORS permita este origen.';
  }
  const cuerpo = err.error as ErrorResponse | null;
  const mensaje = cuerpo?.message ?? `Error ${err.status}: ${err.statusText}`;
  const codigo = codigoSeguimiento(err);
  return codigo ? `${mensaje} (Código de seguimiento: ${codigo})` : mensaje;
}

/** Identificador de la petición: del cuerpo del error o, si no viene, de la cabecera. */
export function codigoSeguimiento(err: HttpErrorResponse): string | null {
  const cuerpo = err.error as ErrorResponse | null;
  return cuerpo?.requestId || err.headers?.get('X-Request-Id') || null;
}

export function erroresDeValidacion(err: HttpErrorResponse): Record<string, string> {
  const cuerpo = err.error as ErrorResponse | null;
  return cuerpo?.validationErrors ?? {};
}
