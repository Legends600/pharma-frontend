import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { codigoSeguimiento, mensajeError } from './http-error';

describe('http-error', () => {
  it('agrega el código de seguimiento que llega en el cuerpo', () => {
    const err = new HttpErrorResponse({
      status: 409,
      error: { message: 'Ya existe', requestId: 'a1b2c3d4' },
    });
    expect(mensajeError(err)).toBe('Ya existe (Código de seguimiento: a1b2c3d4)');
  });

  it('usa la cabecera cuando el cuerpo no trae el identificador', () => {
    const err = new HttpErrorResponse({
      status: 500,
      statusText: 'Server Error',
      headers: new HttpHeaders({ 'X-Request-Id': 'ffff0000' }),
    });
    expect(codigoSeguimiento(err)).toBe('ffff0000');
    expect(mensajeError(err)).toContain('Código de seguimiento: ffff0000');
  });

  it('no inventa un código si no hay identificador', () => {
    const err = new HttpErrorResponse({ status: 404, error: { message: 'No existe' } });
    expect(mensajeError(err)).toBe('No existe');
  });

  it('informa la falta de conexión sin código', () => {
    const err = new HttpErrorResponse({ status: 0 });
    expect(mensajeError(err)).toContain('No se pudo conectar');
  });
});
