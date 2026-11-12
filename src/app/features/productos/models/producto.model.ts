import { ConsultaPagina } from '../../../core/models/pagina';

export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  estado: boolean;
  categoriaId: number;
  categoriaNombre: string;
  fechaCreacion: string;
  fechaModificacion: string | null;
  /** Usuario que creó / modificó por última vez (columnas de auditoría). */
  creadoPor: string | null;
  modificadoPor: string | null;
}

export interface ProductoRequest {
  nombre: string;
  precio: number;
  stock: number;
  estado: boolean;
  categoriaId: number;
}

/** Campos que el backend acepta en ordenarPor. */
export type OrdenProducto = 'id' | 'nombre' | 'precio' | 'stock';
export type Direccion = 'asc' | 'desc';

/** Página de productos con los filtros opcionales del backend. */
export interface ConsultaProductos extends ConsultaPagina {
  nombre?: string | null;
  categoriaId?: number | null;
  /** Solo activos con stock (la nueva venta). */
  disponibles?: boolean;
}
