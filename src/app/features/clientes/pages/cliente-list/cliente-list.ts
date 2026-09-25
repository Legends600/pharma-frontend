import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Cliente } from '../../models/cliente.model';
import { ClienteService } from '../../services/cliente-service';
import { mensajeError } from '../../../../core/utils/http-error';

@Component({
  selector: 'app-cliente-list',
  imports: [RouterLink],
  templateUrl: './cliente-list.html',
  styleUrl: './cliente-list.css',
})
export class ClienteList implements OnInit {
  private readonly clienteService = inject(ClienteService);

  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly filtro = signal('');

  /** Filtra por DNI, nombres o apellidos sin enviar peticiones nuevas. */
  protected readonly filtrados = computed(() => {
    const texto = this.filtro().trim().toLowerCase();
    return this.clientes().filter(c =>
      `${c.dni} ${c.nombres} ${c.apellidos}`.toLowerCase().includes(texto),
    );
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.clienteService.listar().subscribe({
      next: datos => {
        this.clientes.set(datos);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  eliminar(cliente: Cliente): void {
    if (!confirm(`¿Eliminar al cliente "${cliente.nombres} ${cliente.apellidos}"?`)) {
      return;
    }
    this.error.set(null);
    this.clienteService.eliminar(cliente.id).subscribe({
      next: () => this.clientes.update(lista => lista.filter(c => c.id !== cliente.id)),
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });
  }
}
