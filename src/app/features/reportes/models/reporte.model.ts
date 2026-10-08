/** Fila de GET /reportes/ventas-por-categoria (VentaPorCategoriaDTO). */
export interface VentaPorCategoria {
  categoriaId: number;
  categoriaNombre: string;
  cantidadVendida: number;
  montoTotal: number;
}
