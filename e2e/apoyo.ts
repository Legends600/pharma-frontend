import { APIRequestContext, expect, Page } from '@playwright/test';

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
  // exact: con el aviso de expiración visible también existe «Cerrar sesión ahora» (INC-05)
  await expect(page.getByRole('button', { name: 'Cerrar sesión', exact: true })).toBeVisible();
}

/** API de PharmaBackend: algunas pruebas preparan o comprueban datos sin pasar por la SPA. */
export const API = 'http://localhost:8080/api/v1';

/** Token de un usuario de prueba, para llamadas directas a la API. */
export async function tokenApi(request: APIRequestContext, quien: keyof typeof USUARIOS): Promise<string> {
  const { usuario, clave } = USUARIOS[quien];
  const r = await request.post(`${API}/auth/login`, { data: { username: usuario, password: clave } });
  expect(r.status()).toBe(200);
  return (await r.json()).token;
}

/** Primer producto que coincide con el nombre (activo y con stock). */
export async function productoApi(request: APIRequestContext, token: string, nombre: string) {
  const r = await request.get(`${API}/productos`, {
    params: { nombre, disponibles: true, tamanio: 1, pagina: 0, ordenarPor: 'nombre', direccion: 'asc' },
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(r.status()).toBe(200);
  const [producto] = (await r.json()).contenido;
  return producto as { id: number; nombre: string; stock: number };
}
