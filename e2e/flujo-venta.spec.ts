import { expect, test } from '@playwright/test';
import { iniciarSesion } from './apoyo';

test('E2E-07 flujo principal: el vendedor registra una venta y el stock baja', async ({ page }) => {
  await iniciarSesion(page, 'vendedor', '/ventas/nueva');

  // Cliente
  await page.getByTestId('buscar-cliente').fill('Mamani');
  await page.getByTestId('opcion-cliente').first().click();

  // Producto: se lee el stock antes de vender (la búsqueda la responde el servidor)
  await page.getByTestId('buscar-producto').fill('Paracetamol');
  const opcion = page.getByTestId('opcion-producto').first();
  const stockAntes = Number(await opcion.getAttribute('data-stock'));
  await opcion.click();
  await page.getByTestId('cantidad').last().fill('2');

  await expect(page.getByTestId('total-venta')).not.toHaveText('S/ 0.00');

  // PharmaSoft pide revisar y confirmar antes de registrar (sesión 9).
  // Sin imprimir el comprobante: la prueba no abre el diálogo de impresión.
  await page.getByRole('button', { name: 'Revisar venta' }).click();
  await page.getByLabel('Imprimir el comprobante al registrar').uncheck();

  const registro = page.waitForResponse(
    r => r.url().endsWith('/api/v1/ventas') && r.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Confirmar venta' }).click();
  expect((await registro).status()).toBe(201);
  await expect(page.getByText(/Venta .* registrada/)).toBeVisible();

  // Integración con Productos: el stock refleja la venta (caché invalidada)
  await page.goto('/productos?orden=nombre&dir=asc');
  const fila = page.getByTestId('tabla-productos').locator('tr', { hasText: 'Paracetamol' }).first();
  await expect(fila).toContainText(String(stockAntes - 2));
});
