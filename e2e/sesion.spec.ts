import { expect, test } from '@playwright/test';
import { iniciarSesion } from './apoyo';

test('E2E-14 token alterado en sessionStorage: vuelve al login con el aviso de sesión expirada', async ({
  page,
}) => {
  await iniciarSesion(page, 'vendedor', '/productos');
  await expect(page.getByTestId('tabla-productos')).toBeVisible();

  // Se cambia la firma del token: el backend lo rechaza con 401
  await page.evaluate(() => {
    const clave = 'pharmasoft.sesion';
    const sesion = JSON.parse(sessionStorage.getItem(clave)!);
    sesion.token = sesion.token.slice(0, -4) + 'XXXX';
    sessionStorage.setItem(clave, JSON.stringify(sesion));
  });
  const rechazo = page.waitForResponse(r => r.url().includes('/api/v1/productos') && r.status() === 401);
  await page.reload();
  await rechazo;

  await expect(page).toHaveURL(/\/login\?.*expirada=1/);
  await expect(page.getByRole('status')).toHaveText(/Su sesión expiró/);
  await expect(page).toHaveURL(/returnUrl=%2Fproductos/);
});

test('E2E-15 la venta en curso se recupera tras volver a iniciar sesión (INC-06)', async ({ page }) => {
  await iniciarSesion(page, 'vendedor', '/ventas/nueva');
  await page.getByTestId('buscar-cliente').fill('Mamani');
  await page.getByTestId('opcion-cliente').first().click();
  await page.getByTestId('buscar-producto').fill('Gasa');
  await page.getByTestId('opcion-producto').first().click();
  await page.getByTestId('cantidad').last().fill('3');

  // El token deja de ser válido a mitad de la venta
  await page.evaluate(() => {
    const clave = 'pharmasoft.sesion';
    const sesion = JSON.parse(sessionStorage.getItem(clave)!);
    sesion.token = sesion.token.slice(0, -4) + 'XXXX';
    sessionStorage.setItem(clave, JSON.stringify(sesion));
  });
  await page.reload();
  await expect(page).toHaveURL(/\/login\?.*returnUrl=%2Fventas%2Fnueva/);

  await page.getByLabel('Usuario').fill('vendedor');
  await page.getByLabel('Contraseña', { exact: true }).fill('Vendedor2026*');
  await page.getByRole('button', { name: 'Ingresar' }).click();

  await expect(page).toHaveURL(/\/ventas\/nueva$/);
  await expect(page.getByTestId('venta-recuperada')).toBeVisible();
  await expect(page.getByText(/Mamani/)).toBeVisible();
  await expect(page.getByTestId('cantidad')).toHaveValue('3');
});
