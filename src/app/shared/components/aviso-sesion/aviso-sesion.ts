import { Component, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/auth/auth-service';

/**
 * Aviso fijo que aparece cuando faltan dos minutos o menos para que el
 * token venza. Solo informa: el backend no permite renovar el token.
 *
 * La «×» lo oculta hasta la siguiente sesión: el componente vive dentro
 * del layout y el login está fuera, así que al volver a entrar se crea
 * de nuevo con oculto = false.
 */
@Component({
  selector: 'app-aviso-sesion',
  templateUrl: './aviso-sesion.html',
  styleUrl: './aviso-sesion.css',
})
export class AvisoSesion {
  protected readonly auth = inject(AuthService);
  protected readonly oculto = signal(false);

  protected readonly visible = computed(() => this.auth.porVencer() && !this.oculto());

  /** Cuenta regresiva en formato mm:ss. */
  protected readonly tiempo = computed(() => {
    const s = this.auth.segundosRestantes();
    const dosDigitos = (n: number) => String(n).padStart(2, '0');
    return `${dosDigitos(Math.floor(s / 60))}:${dosDigitos(s % 60)}`;
  });

  cerrarAhora(): void {
    this.auth.cerrarSesion();
  }
}
