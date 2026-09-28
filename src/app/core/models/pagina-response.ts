/** Refleja el PaginaResponseDTO del backend; sirve para cualquier listado paginado. */
export interface PaginaResponse<T> {
  contenido: T[];
  pagina: number;
  tamanio: number;
  totalElementos: number;
  totalPaginas: number;
  ultima: boolean;
}
