import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Cliente } from '../../models/cliente.model';
import { ClienteService } from '../../services/cliente-service';
import { PaginaResponse } from '../../../../core/models/pagina-response';
import { mensajeError } from '../../../../core/utils/http-error';

type CampoOrden = 'dni' | 'apellidos';

@Component({
  selector: 'app-cliente-list',
  imports: [RouterLink],
  templateUrl: './cliente-list.html',
  styleUrl: './cliente-list.css',
})
export class ClienteList {
  private readonly clienteService = inject(ClienteService);
  private peticion?: Subscription;

  protected readonly tamanios = [5, 10, 20];

  // Parámetros de la consulta: si cambia cualquiera, se vuelve a llamar a listar().
  protected readonly pagina = signal(0);
  protected readonly tamanio = signal(10);
  protected readonly ordenarPor = signal<CampoOrden>('apellidos');
  protected readonly direccion = signal<'asc' | 'desc'>('asc');

  protected readonly respuesta = signal<PaginaResponse<Cliente> | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly filtro = signal('');

  /** Filtra la página actual por DNI o por nombres y apellidos, sin nuevas peticiones. */
  protected readonly filtrados = computed(() => {
    const texto = this.filtro().trim().toLowerCase();
    const clientes = this.respuesta()?.contenido ?? [];
    return clientes.filter(c =>
      `${c.dni} ${c.nombres} ${c.apellidos}`.toLowerCase().includes(texto),
    );
  });

  protected readonly totalPaginas = computed(() => Math.max(this.respuesta()?.totalPaginas ?? 0, 1));
  protected readonly esPrimera = computed(() => this.pagina() === 0);
  protected readonly esUltima = computed(() => this.respuesta()?.ultima ?? true);

  constructor() {
    effect(() => {
      // Lectura de los cuatro signals para que el effect se vuelva a ejecutar cuando cambien.
      this.pagina();
      this.tamanio();
      this.ordenarPor();
      this.direccion();
      untracked(() => this.cargar());
    });
  }

  cargar(): void {
    this.peticion?.unsubscribe();
    this.cargando.set(true);
    this.error.set(null);
    this.peticion = this.clienteService
      .listar(this.pagina(), this.tamanio(), this.ordenarPor(), this.direccion())
      .subscribe({
        next: datos => {
          this.respuesta.set(datos);
          this.cargando.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(mensajeError(err));
          this.cargando.set(false);
        },
      });
  }

  anterior(): void {
    this.pagina.update(p => Math.max(p - 1, 0));
  }

  siguiente(): void {
    this.pagina.update(p => p + 1);
  }

  cambiarTamanio(valor: string): void {
    this.tamanio.set(Number(valor));
    this.pagina.set(0);
  }

  /** Primer clic ordena por el campo; un segundo clic invierte la dirección. */
  ordenar(campo: CampoOrden): void {
    if (this.ordenarPor() === campo) {
      this.direccion.update(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.ordenarPor.set(campo);
      this.direccion.set('asc');
    }
    this.pagina.set(0);
  }

  indicadorOrden(campo: CampoOrden): string {
    if (this.ordenarPor() !== campo) {
      return '↕';
    }
    return this.direccion() === 'asc' ? '▲' : '▼';
  }

  darDeBaja(cliente: Cliente): void {
    if (!confirm(`¿Dar de baja al cliente "${cliente.apellidos}, ${cliente.nombres}"?`)) {
      return;
    }
    this.error.set(null);
    this.clienteService.eliminar(cliente.id).subscribe({
      // La baja es lógica: se recarga la página para ver la fila como «Inactivo».
      next: () => this.cargar(),
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });
  }
}
