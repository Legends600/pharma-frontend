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
