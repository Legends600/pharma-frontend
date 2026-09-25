import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Cliente, ClienteRequest } from '../models/cliente.model';

@Service()
export class ClienteService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/clientes`;

  listar(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.url);
  }

  obtener(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.url}/${id}`);
  }

  crear(dto: ClienteRequest): Observable<Cliente> {
    return this.http.post<Cliente>(this.url, dto);
  }

  actualizar(id: number, dto: ClienteRequest): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.url}/${id}`, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
