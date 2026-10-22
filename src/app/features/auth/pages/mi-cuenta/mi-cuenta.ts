import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Perfil, Permiso } from '../../../../core/auth/auth.model';
import { AuthService } from '../../../../core/auth/auth-service';
import { mensajeError } from '../../../../core/utils/http-error';

interface Modulo {
  nombre: string;
  permisos: { permiso: Permiso; etiqueta: string }[];
}

/** Permisos del backend agrupados por módulo, en el orden en que se muestran. */
const MODULOS: Modulo[] = [
  { nombre: 'Catálogo', permisos: [{ permiso: 'CATALOGO_LEER', etiqueta: 'Leer' }, { permiso: 'CATALOGO_ESCRIBIR', etiqueta: 'Escribir' }] },
  { nombre: 'Clientes', permisos: [{ permiso: 'CLIENTES_LEER', etiqueta: 'Leer' }, { permiso: 'CLIENTES_ESCRIBIR', etiqueta: 'Escribir' }] },
  { nombre: 'Ventas', permisos: [{ permiso: 'VENTAS_LEER', etiqueta: 'Leer' }, { permiso: 'VENTAS_REGISTRAR', etiqueta: 'Registrar' }] },
  { nombre: 'Reportes', permisos: [{ permiso: 'REPORTES_VER', etiqueta: 'Ver' }] },
  { nombre: 'Usuarios', permisos: [{ permiso: 'USUARIOS_ADMINISTRAR', etiqueta: 'Administrar' }] },
];

/**
 * Datos del usuario tal como los conoce el servidor (GET /auth/me).
 * Compara los permisos del servidor con los guardados en la sesión: si el
 * administrador cambió los roles, la sesión quedó desactualizada.
 */
@Component({
  selector: 'app-mi-cuenta',
  templateUrl: './mi-cuenta.html',
  styleUrl: './mi-cuenta.css',
})
export class MiCuenta implements OnInit {
  private readonly auth = inject(AuthService);

  protected readonly modulos = MODULOS;
  protected readonly perfil = signal<Perfil | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);

  /** true si los permisos del servidor no coinciden con los de la sesión. */
  protected readonly permisosCambiaron = computed(() => {
    const perfil = this.perfil();
    const sesion = this.auth.sesion();
    if (!perfil || !sesion) return false;
    const delServidor = new Set(perfil.permisos);
    const deLaSesion = new Set(sesion.permisos);
    return delServidor.size !== deLaSesion.size || [...delServidor].some(p => !deLaSesion.has(p));
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.auth.obtenerPerfil().subscribe({
      next: perfil => {
        this.perfil.set(perfil);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  tiene(permiso: Permiso): boolean {
    return this.perfil()?.permisos.includes(permiso) ?? false;
  }
}
