import { inject, Service } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Pagina } from '../../../core/models/pagina';
import { ConsultaProductos, Producto, ProductoRequest } from '../models/producto.model';

@Service()
export class ProductoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/productos`;

  /** Una página de productos; los filtros vacíos no se envían. */
  listar(c: ConsultaProductos): Observable<Pagina<Producto>> {
    let params = new HttpParams()
      .set('pagina', c.pagina)
      .set('tamanio', c.tamanio)
      .set('ordenarPor', c.ordenarPor)
      .set('direccion', c.direccion);
    if (c.nombre?.trim()) params = params.set('nombre', c.nombre.trim());
    if (c.categoriaId) params = params.set('categoriaId', c.categoriaId);
    if (c.disponibles) params = params.set('disponibles', true);
    return this.http.get<Pagina<Producto>>(this.url, { params });
  }

  obtener(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.url}/${id}`);
  }

  crear(dto: ProductoRequest): Observable<Producto> {
    return this.http.post<Producto>(this.url, dto);
  }

  actualizar(id: number, dto: ProductoRequest): Observable<Producto> {
    return this.http.put<Producto>(`${this.url}/${id}`, dto);
  }

  /** Baja lógica: el backend marca estado = false. */
  darDeBaja(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
