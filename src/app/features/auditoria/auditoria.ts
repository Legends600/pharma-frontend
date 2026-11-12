import { Component, computed, inject, input, linkedSignal, numberAttribute } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Pagina } from '../../core/models/pagina';
import { mensajeError } from '../../core/utils/http-error';
import { Paginador } from '../../shared/components/paginador/paginador';

/** Fila de GET /api/v1/auditoria (AuditoriaEventoDTO). */
export interface EventoAuditoria {
  id: number;
  fecha: string;
  usuario: string;
  accion: string;
  entidad: string;
  entidadId: number | null;
  detalle: string | null;
  requestId: string | null;
}

const ACCIONES = [
  'VENTA_REGISTRADA',
  'VENTA_ANULADA',
  'PRECIO_MODIFICADO',
  'PRODUCTO_ELIMINADO',
  'CLIENTE_REGISTRADO',
  'CLIENTE_DESACTIVADO',
  'CATEGORIA_ELIMINADA',
  'USUARIO_ACTIVADO',
  'USUARIO_DESACTIVADO',
  'LOGIN_EXITOSO',
  'LOGIN_FALLIDO',
];
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const texto = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

/** Bitácora de eventos: quién hizo qué y cuándo. Solo USUARIOS_ADMINISTRAR. */
@Component({
  selector: 'app-auditoria',
  imports: [DatePipe, Paginador],
  templateUrl: './auditoria.html',
  styleUrl: './auditoria.css',
})
export class Auditoria {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  protected readonly acciones = ACCIONES;

  // Filtros y página en la URL (?usuario=vendedor&accion=VENTA_REGISTRADA&pagina=0)
  readonly pagina = input(0, { transform: (v: unknown) => Math.max(numberAttribute(v, 0), 0) });
  readonly tamanio = input(20, {
    transform: (v: unknown) => Math.min(Math.max(numberAttribute(v, 20), 1), 100),
  });
  readonly usuario = input('', { transform: texto });
  readonly accion = input('', { transform: (v: unknown) => (ACCIONES.includes(texto(v)) ? texto(v) : '') });
  readonly desde = input('', { transform: (v: unknown) => (FECHA.test(texto(v)) ? texto(v) : '') });
  readonly hasta = input('', { transform: (v: unknown) => (FECHA.test(texto(v)) ? texto(v) : '') });

  protected readonly eventos = rxResource({
    params: () => ({
      pagina: this.pagina(),
      tamanio: this.tamanio(),
      usuario: this.usuario(),
      accion: this.accion(),
      desde: this.desde(),
      hasta: this.hasta(),
    }),
    stream: ({ params }) => {
      let p = new HttpParams();
      for (const [clave, valor] of Object.entries(params)) {
        if (valor !== '') p = p.set(clave, valor);
      }
      return this.http.get<Pagina<EventoAuditoria>>(`${environment.apiUrl}/auditoria`, { params: p });
    },
  });

  protected readonly pag = linkedSignal<Pagina<EventoAuditoria> | undefined, Pagina<EventoAuditoria> | undefined>({
    source: () => (this.eventos.hasValue() ? this.eventos.value() : undefined),
    computation: (nueva, previa) => nueva ?? previa?.value,
  });

  protected readonly error = computed(() => {
    const err = this.eventos.error();
    return err ? mensajeError(err as HttpErrorResponse) : null;
  });

  /** Cualquier filtro nuevo vuelve a la primera página. */
  protected filtrar(campo: 'usuario' | 'accion' | 'desde' | 'hasta', valor: string): void {
    this.navegar({ [campo]: valor.trim() || null, pagina: 0 });
  }

  protected limpiar(): void {
    this.navegar({ usuario: null, accion: null, desde: null, hasta: null, pagina: 0 });
  }

  protected irA(pagina: number): void {
    this.navegar({ pagina });
  }

  protected cambiarTamanio(tamanio: number): void {
    this.navegar({ tamanio, pagina: 0 });
  }

  private navegar(cambios: Record<string, string | number | null>): void {
    this.router.navigate([], { queryParams: cambios, queryParamsHandling: 'merge' });
  }
}
