import { Component, computed, inject, input, linkedSignal, numberAttribute } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { Pagina } from '../../../../core/models/pagina';
import { mensajeError } from '../../../../core/utils/http-error';
import { Paginador } from '../../../../shared/components/paginador/paginador';
import { SiPermiso } from '../../../../shared/directives/si-permiso';
import { CategoriaService } from '../../../categorias/services/categoria-service';
import { Direccion, OrdenProducto, Producto } from '../../models/producto.model';
import { ProductoService } from '../../services/producto-service';

const ORDENES: OrdenProducto[] = ['id', 'nombre', 'precio', 'stock'];

/** Convierte el query param en un id; vacío o inválido → sin filtro. */
const idOpcional = (v: unknown): number | null => {
  const n = numberAttribute(v, NaN);
  return Number.isFinite(n) && n > 0 ? n : null;
};

@Component({
  selector: 'app-producto-list',
  imports: [RouterLink, CurrencyPipe, SiPermiso, Paginador],
  templateUrl: './producto-list.html',
  styleUrl: './producto-list.css',
})
export class ProductoList {
  private readonly productoService = inject(ProductoService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly router = inject(Router);

  // Llegan de la URL (?pagina=2&tamanio=20&orden=nombre&dir=asc&categoriaId=3)
  // gracias a withComponentInputBinding(): F5 o un enlace conservan la vista.
  readonly pagina = input(0, { transform: (v: unknown) => Math.max(numberAttribute(v, 0), 0) });
  readonly tamanio = input(20, {
    transform: (v: unknown) => Math.min(Math.max(numberAttribute(v, 20), 1), 100),
  });
  readonly orden = input<OrdenProducto, unknown>('nombre', {
    transform: (v: unknown) => (ORDENES.includes(v as OrdenProducto) ? (v as OrdenProducto) : 'nombre'),
  });
  readonly dir = input<Direccion, unknown>('asc', {
    transform: (v: unknown): Direccion => (v === 'desc' ? 'desc' : 'asc'),
  });
  /** También llega desde «Ver productos» en Categorías. */
  readonly categoriaId = input(null, { transform: idOpcional });

  protected readonly categorias = toSignal(this.categoriaService.listar(), { initialValue: [] });

  // rxResource vuelve a pedir la página cuando cambia un parámetro y cancela la anterior.
  protected readonly productos = rxResource({
    params: () => ({
      pagina: this.pagina(),
      tamanio: this.tamanio(),
      ordenarPor: this.orden(),
      direccion: this.dir(),
      categoriaId: this.categoriaId(),
    }),
    stream: ({ params }) => this.productoService.listar(params),
  });

  // Conserva la página anterior mientras llega la nueva (sin parpadeo).
  protected readonly pag = linkedSignal<Pagina<Producto> | undefined, Pagina<Producto> | undefined>({
    source: () => (this.productos.hasValue() ? this.productos.value() : undefined),
    computation: (nueva, previa) => nueva ?? previa?.value,
  });

  protected readonly error = computed(() => {
    const err = this.productos.error();
    return err ? mensajeError(err as HttpErrorResponse) : null;
  });

  protected readonly nombreCategoria = computed(() => {
    const id = this.categoriaId();
    return id ? (this.categorias().find(c => c.id === id)?.nombre ?? `#${id}`) : null;
  });

  protected irAPagina(pagina: number): void {
    this.navegar({ pagina });
  }

  protected cambiarTamanio(tamanio: number): void {
    this.navegar({ tamanio, pagina: 0 }); // vuelve a la primera
  }

  /** Primer clic ordena por el campo; un segundo clic invierte la dirección. */
  protected ordenarPor(campo: OrdenProducto): void {
    const dir = this.orden() === campo && this.dir() === 'asc' ? 'desc' : 'asc';
    this.navegar({ orden: campo, dir, pagina: 0 });
  }

  protected indicadorOrden(campo: OrdenProducto): string {
    if (this.orden() !== campo) return '↕';
    return this.dir() === 'asc' ? '▲' : '▼';
  }

  /** El filtro lo aplica el servidor sobre todos los productos, no sobre la página visible. */
  protected filtrarPorCategoria(valor: string): void {
    this.navegar({ categoriaId: valor ? Number(valor) : null, pagina: 0 });
  }

  protected darDeBaja(producto: Producto): void {
    if (!confirm(`¿Dar de baja el producto "${producto.nombre}"?`)) {
      return;
    }
    this.productoService.darDeBaja(producto.id).subscribe({
      // La baja es lógica: se vuelve a pedir la página para ver la fila como «Inactivo».
      next: () => this.productos.reload(),
      error: (err: HttpErrorResponse) => alert(mensajeError(err)),
    });
  }

  private navegar(cambios: Record<string, string | number | null>): void {
    this.router.navigate([], { queryParams: cambios, queryParamsHandling: 'merge' });
  }
}
