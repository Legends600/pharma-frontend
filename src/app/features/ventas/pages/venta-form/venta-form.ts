import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { mensajeError } from '../../../../core/utils/http-error';
import { redondear } from '../../../../core/utils/numeros';
import { Cliente } from '../../../clientes/models/cliente.model';
import { ClienteService } from '../../../clientes/services/cliente-service';
import { Producto } from '../../../productos/models/producto.model';
import { ProductoService } from '../../../productos/services/producto-service';
import { VentaRequest } from '../../models/venta.model';
import { VentaService } from '../../services/venta-service';

/** Controles de una línea de detalle. */
interface LineaForm {
  productoId: FormControl<number | null>;
  cantidad: FormControl<number>;
}

@Component({
  selector: 'app-venta-form',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe],
  templateUrl: './venta-form.html',
  styleUrl: './venta-form.css',
})
export class VentaForm implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly ventaService = inject(VentaService);
  private readonly clienteService = inject(ClienteService);
  private readonly productoService = inject(ProductoService);
  private readonly router = inject(Router);

  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly productos = signal<Producto[]>([]);
  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  // ---------- Cabecera + detalle dinámico ----------
  protected readonly form = this.fb.group({
    clienteId: this.fb.control<number | null>(null, Validators.required),
    detalles: this.fb.array<FormGroup<LineaForm>>([], Validators.required),
  });

  /** Producto elegido en el select para agregarlo como línea. */
  protected readonly productoElegido = new FormControl<number | null>(null);

  get detalles() {
    return this.form.controls.detalles;
  }

  private nuevaLinea(productoId: number): FormGroup<LineaForm> {
    return this.fb.group({
      productoId: this.fb.control<number | null>(productoId, Validators.required),
      cantidad: this.fb.control(1, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]),
    });
  }

  agregarLinea(): void {
    const id = this.productoElegido.value;
    if (id === null) return;
    this.detalles.push(this.nuevaLinea(id));
    this.productoElegido.setValue(null);
  }

  quitarLinea(indice: number): void {
    this.detalles.removeAt(indice);
  }

  // ---------- Cálculos a partir del valor del formulario ----------
  private readonly valor = toSignal(this.form.valueChanges, { initialValue: this.form.value });

  private readonly productoPorId = computed(() => new Map(this.productos().map(p => [p.id, p])));

  protected readonly lineas = computed(() =>
    (this.valor().detalles ?? []).map(d => {
      const producto = d.productoId ? this.productoPorId().get(d.productoId) : undefined;
      const cantidad = Number(d.cantidad) || 0;
      const precio = producto?.precio ?? 0;
      return { producto, precio, subtotal: redondear(precio * cantidad) };
    }),
  );

  protected readonly total = computed(() =>
    redondear(this.lineas().reduce((suma, l) => suma + l.subtotal, 0)),
  );

  ngOnInit(): void {
    forkJoin({
      clientes: this.clienteService.listar(0, 100),
      productos: this.productoService.listar(0, 100, 'nombre', 'asc'),
    }).subscribe({
      next: ({ clientes, productos }) => {
        this.clientes.set(clientes.contenido.filter(c => c.estado));
        this.productos.set(productos.contenido.filter(p => p.estado && p.stock > 0));
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const dto: VentaRequest = {
      clienteId: Number(v.clienteId),
      detalles: v.detalles.map(d => ({ productoId: Number(d.productoId), cantidad: Number(d.cantidad) })),
    };
    this.guardando.set(true);
    this.ventaService.registrar(dto).subscribe({
      next: () => this.router.navigate(['/ventas']),
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.error.set(mensajeError(err));
      },
    });
  }
}
