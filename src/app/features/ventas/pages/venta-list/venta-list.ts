import { Component, computed, DestroyRef, effect, inject, input, linkedSignal, numberAttribute, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';
import { Pagina } from '../../../../core/models/pagina';
import { mensajeError } from '../../../../core/utils/http-error';
import { redondear } from '../../../../core/utils/numeros';
import { Paginador } from '../../../../shared/components/paginador/paginador';
import { SiPermiso } from '../../../../shared/directives/si-permiso';
import { Cliente } from '../../../clientes/models/cliente.model';
import { ClienteService } from '../../../clientes/services/cliente-service';
import { EstadoVenta, Venta } from '../../models/venta.model';
import { VentaService } from '../../services/venta-service';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const fechaOpcional = (v: unknown): string | null => (typeof v === 'string' && FECHA.test(v) ? v : null);
const idOpcional = (v: unknown): number | null => {
  const n = numberAttribute(v, NaN);
  return Number.isFinite(n) && n > 0 ? n : null;
};

@Component({
  selector: 'app-venta-list',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe, SiPermiso, Paginador],
  templateUrl: './venta-list.html',
  styleUrl: './venta-list.css',
})
export class VentaList {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly ventaService = inject(VentaService);
  private readonly clienteService = inject(ClienteService);
  private readonly router = inject(Router);

  // Página y filtros llegan de la URL: F5, Atrás o un enlace muestran la misma consulta.
  readonly pagina = input(0, { transform: (v: unknown) => Math.max(numberAttribute(v, 0), 0) });
  readonly tamanio = input(10, {
    transform: (v: unknown) => Math.min(Math.max(numberAttribute(v, 10), 1), 100),
  });
  readonly clienteId = input(null, { transform: idOpcional });
  readonly estado = input<EstadoVenta | null, unknown>(null, {
    transform: (v: unknown) => (v === 'REGISTRADA' || v === 'ANULADA' ? v : null),
  });
  readonly desde = input(null, { transform: fechaOpcional });
  readonly hasta = input(null, { transform: fechaOpcional });

  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly avisoFiltro = signal<string | null>(null);

  protected readonly filtros = this.fb.group({
    clienteId: this.fb.control<number | null>(null),
    estado: this.fb.control<EstadoVenta | null>(null),
    desde: this.fb.control<string | null>(null),
    hasta: this.fb.control<string | null>(null),
  });

  protected readonly ventas = rxResource({
    params: () => ({
      filtro: {
        clienteId: this.clienteId(),
        estado: this.estado(),
        desde: this.desde(),
        hasta: this.hasta(),
      },
      pagina: this.pagina(),
      tamanio: this.tamanio(),
    }),
    stream: ({ params }) => this.ventaService.buscar(params.filtro, params.pagina, params.tamanio),
  });

  // Conserva la página anterior mientras llega la nueva (sin parpadeo).
  protected readonly resultado = linkedSignal<Pagina<Venta> | undefined, Pagina<Venta> | undefined>({
    source: () => (this.ventas.hasValue() ? this.ventas.value() : undefined),
    computation: (nueva, previa) => nueva ?? previa?.value,
  });

  protected readonly error = computed(() => {
    const err = this.ventas.error();
    return this.avisoFiltro() ?? (err ? mensajeError(err as HttpErrorResponse) : null);
  });

  protected readonly ahora = signal(new Date());

  /** Suma de los totales de la página mostrada (solo ventas REGISTRADAS). */
  protected readonly totalPagina = computed(() =>
    redondear(
      (this.resultado()?.contenido ?? [])
        .filter(v => v.estado === 'REGISTRADA')
        .reduce((suma, v) => suma + v.total, 0),
    ),
  );

  constructor() {
    this.clienteService.listar(0, 100).subscribe({
      next: p => this.clientes.set(p.contenido),
      error: (err: HttpErrorResponse) => this.avisoFiltro.set(mensajeError(err)),
    });

    // URL → formulario (sin disparar una nueva navegación).
    effect(() => {
      this.filtros.setValue(
        { clienteId: this.clienteId(), estado: this.estado(), desde: this.desde(), hasta: this.hasta() },
        { emitEvent: false },
      );
    });

    // Formulario → URL: al cambiar un filtro se vuelve a la primera página, porque
    // la página 7 del filtro anterior puede no existir con el nuevo. Las fechas
    // se escriben dígito a dígito: se espera 300 ms antes de navegar.
    this.filtros.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(() => this.aplicarFiltros());
  }

  /** Texto con los filtros aplicados, para el encabezado impreso. */
  protected resumenFiltros(): string {
    const f = this.filtros.getRawValue();
    const cliente = this.clientes().find(c => c.id === f.clienteId);
    const partes = [
      cliente ? `cliente ${cliente.apellidos}, ${cliente.nombres}` : '',
      f.estado ? `estado ${f.estado}` : '',
      f.desde ? `desde ${f.desde}` : '',
      f.hasta ? `hasta ${f.hasta}` : '',
    ].filter(Boolean);
    return partes.length ? partes.join(' · ') : 'ninguno (todas las ventas)';
  }

  imprimirConsulta(): void {
    this.ahora.set(new Date());
    setTimeout(() => window.print());
  }

  aplicarFiltros(): void {
    const f = this.filtros.getRawValue();
    // Misma regla que el backend (409): se valida antes de enviar la petición.
    if (f.desde && f.hasta && f.desde > f.hasta) {
      this.avisoFiltro.set('La fecha «desde» no puede ser posterior a la fecha «hasta».');
      return;
    }
    this.avisoFiltro.set(null);
    const iguales =
      f.clienteId === this.clienteId() &&
      f.estado === this.estado() &&
      (f.desde || null) === this.desde() &&
      (f.hasta || null) === this.hasta();
    if (iguales) return;
    this.navegar({
      clienteId: f.clienteId,
      estado: f.estado,
      desde: f.desde || null,
      hasta: f.hasta || null,
      pagina: 0,
    });
  }

  limpiar(): void {
    this.filtros.reset();
  }

  irA(pagina: number): void {
    this.navegar({ pagina });
  }

  cambiarTamanio(tamanio: number): void {
    this.navegar({ tamanio, pagina: 0 });
  }

  private navegar(cambios: Record<string, string | number | null>): void {
    this.router.navigate([], { queryParams: cambios, queryParamsHandling: 'merge' });
  }
}
