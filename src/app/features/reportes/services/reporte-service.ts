import { inject, Service } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { VentaPorCategoria } from '../models/reporte.model';

@Service()
export class ReporteService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/reportes`;

  /** Solo se envían las fechas que tienen valor; sin fechas, el backend devuelve el histórico. */
  ventasPorCategoria(desde: string | null, hasta: string | null): Observable<VentaPorCategoria[]> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get<VentaPorCategoria[]>(`${this.url}/ventas-por-categoria`, { params });
  }
}
