import { expect, test } from '@playwright/test';
import { iniciarSesion } from './apoyo';

test('E2E-10 cliente nuevo y venta inmediata (I-01)', async ({ page }) => {
  const sufijo = String(Date.now()).slice(-7);
  const dni = '7' + sufijo;
  const apellidos = `Prueba E2E ${sufijo}`;

  await iniciarSesion(page, 'vendedor', '/clientes/nuevo');
  await page.getByLabel('DNI').fill(dni);
  await page.getByLabel('Nombres').fill('Carmen');
  await page.getByLabel('Apellidos').fill(apellidos);
  await page.getByLabel('Correo').fill(`carmen.${sufijo}@correo.pe`);
  await page.getByRole('button', { name: /Registrar|Guardar/ }).click();
  await expect(page).toHaveURL(/\/clientes(\?.*)?$/);

  await page.goto('/ventas/nueva');
  await page.getByTestId('buscar-cliente').fill(sufijo);
  await expect(page.getByTestId('opcion-cliente')).toHaveCount(1);
  await page.getByTestId('opcion-cliente').click();
  await expect(page.getByText(`${apellidos}, Carmen`)).toBeVisible();

  await page.getByTestId('buscar-producto').fill('Gasa');
  await page.getByTestId('opcion-producto').first().click();
  await page.getByRole('button', { name: 'Revisar venta' }).click();
  await page.getByLabel('Imprimir el comprobante al registrar').uncheck();
  const registro = page.waitForResponse(
    r => r.url().endsWith('/api/v1/ventas') && r.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Confirmar venta' }).click();
  expect((await registro).status()).toBe(201);
  await expect(page.getByText(/Venta N.º .* registrada/)).toBeVisible();
  await expect(page.getByText(`Carmen ${apellidos}`)).toBeVisible();
});

test('E2E-11 filtro de ventas desde la página 3 vuelve a la página 1 (I-08)', async ({ page }) => {
  await iniciarSesion(page, 'admin', '/ventas?pagina=2');
  await expect(page.getByTestId('pagina-actual')).toHaveText(/Página 3 de/);

  await page.getByLabel('Desde').fill('2026-11-01');
  await expect(page).toHaveURL(/pagina=0/);
  await expect(page).toHaveURL(/desde=2026-11-01/);
  await expect(page.getByTestId('pagina-actual')).toHaveText(/Página 1 de/);
});
