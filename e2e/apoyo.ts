import { expect, Page } from '@playwright/test';

/** Usuarios de prueba de V2__seguridad.sql (solo desarrollo y clase). */
export const USUARIOS = {
  admin: { usuario: 'admin', clave: 'Admin2026*' },
  vendedor: { usuario: 'vendedor', clave: 'Vendedor2026*' },
  almacen: { usuario: 'almacen', clave: 'Almacen2026*' },
} as const;

/** Inicia sesión como lo haría una persona. Cada prueba la llama: ninguna depende de otra. */
export async function iniciarSesion(
  page: Page,
  quien: keyof typeof USUARIOS,
  ruta = '/inicio',
) {
  const { usuario, clave } = USUARIOS[quien];
  await page.goto(ruta);
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel('Usuario').fill(usuario);
  await page.getByLabel('Contraseña', { exact: true }).fill(clave);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
}
