import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { mensajeError } from '../../../../core/utils/http-error';
import { redondear } from '../../../../core/utils/numeros';
import { VentaPorCategoria } from '../../models/reporte.model';
import { ReporteService } from '../../services/reporte-service';

@Component({
  selector: 'app-ventas-categoria',
  imports: [ReactiveFormsModule, CurrencyPipe, DecimalPipe],
  templateUrl: './ventas-categoria.html',
  styleUrl: './ventas-categoria.css',
})
export class VentasCategoria implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly reporteService = inject(ReporteService);

  protected readonly filtros = this.fb.group({
    desde: this.fb.control<string | null>(null),
    hasta: this.fb.control<string | null>(null),
  });

  protected readonly filas = signal<VentaPorCategoria[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  /** Texto del periodo con el que se generó el reporte mostrado. */
  protected readonly periodo = signal('todo el histórico');

  /** Monto de la categoría que más vendió: es el 100 % de las barras. */
  protected readonly mayorMonto = computed(() => Math.max(0, ...this.filas().map(f => f.montoTotal)));

  protected readonly totalUnidades = computed(() =>
    this.filas().reduce((suma, f) => suma + f.cantidadVendida, 0),
  );

  protected readonly totalMonto = computed(() =>
    redondear(this.filas().reduce((suma, f) => suma + f.montoTotal, 0)),
  );

  /** Ancho de la barra: porcentaje del monto respecto del mayor. */
  protected porcentaje(fila: VentaPorCategoria): number {
    const mayor = this.mayorMonto();
    return mayor > 0 ? (fila.montoTotal / mayor) * 100 : 0;
  }

  /** Participación de la categoría en el monto general. */
  protected participacion(fila: VentaPorCategoria): number {
    const total = this.totalMonto();
    return total > 0 ? (fila.montoTotal / total) * 100 : 0;
  }

  ngOnInit(): void {
    this.generar();
  }

  generar(): void {
    const { desde, hasta } = this.filtros.getRawValue();
    // Misma regla que el backend (409): se valida antes de enviar la petición.
    if (desde && hasta && desde > hasta) {
      this.error.set('La fecha «desde» no puede ser posterior a la fecha «hasta».');
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    this.reporteService.ventasPorCategoria(desde, hasta).subscribe({
      next: filas => {
        this.filas.set(filas);
        this.periodo.set(this.describirPeriodo(desde, hasta));
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.filas.set([]);
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  limpiar(): void {
    this.filtros.reset();
    this.generar();
  }

  private describirPeriodo(desde: string | null, hasta: string | null): string {
    if (desde && hasta) return `del ${desde} al ${hasta}`;
    if (desde) return `desde el ${desde}`;
    if (hasta) return `hasta el ${hasta}`;
    return 'todo el histórico';
  }
}
