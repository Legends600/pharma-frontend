import { expect, test } from '@playwright/test';
import { API, iniciarSesion, productoApi, tokenApi } from './apoyo';

test.describe('Reglas de la venta', () => {
  test('E2E-08 venta con más unidades que el stock: se muestra el 409 y no se registra', async ({
    page,
    request,
  }) => {
    const token = await tokenApi(request, 'vendedor');
    const ibuprofeno = await productoApi(request, token, 'Ibuprofeno');
    expect(ibuprofeno.stock).toBeGreaterThanOrEqual(2);

    // El vendedor pide TODO el stock que ve en pantalla…
    await iniciarSesion(page, 'vendedor', '/ventas/nueva');
    await page.getByTestId('buscar-cliente').fill('Mamani');
    await page.getByTestId('opcion-cliente').first().click();
    await page.getByTestId('buscar-producto').fill('Ibuprofeno');
    await page.getByTestId('opcion-producto').first().click();
    await page.getByTestId('cantidad').last().fill(String(ibuprofeno.stock));
    await page.getByRole('button', { name: 'Revisar venta' }).click();
    await page.getByLabel('Imprimir el comprobante al registrar').uncheck();

    // …pero otra caja vende 1 unidad antes de que confirme.
    const otra = await request.post(`${API}/ventas`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { clienteId: 22, detalles: [{ productoId: ibuprofeno.id, cantidad: 1 }] },
    });
    expect(otra.status()).toBe(201);

    const registro = page.waitForResponse(
      r => r.url().endsWith('/api/v1/ventas') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Confirmar venta' }).click();
    expect((await registro).status()).toBe(409);
    await expect(page.getByRole('alert')).toContainText('Stock insuficiente');
    await expect(page).toHaveURL(/\/ventas\/nueva$/);

    // La venta no se registró: el stock solo bajó por la otra caja.
    const despues = await productoApi(request, token, 'Ibuprofeno');
    expect(despues.stock).toBe(ibuprofeno.stock - 1);
  });

  test('E2E-09 venta sin productos: no se puede revisar ni registrar', async ({ page }) => {
    let posts = 0;
    page.on('request', r => {
      if (r.method() === 'POST' && r.url().endsWith('/api/v1/ventas')) posts++;
    });
    await iniciarSesion(page, 'vendedor', '/ventas/nueva');
    await page.getByTestId('buscar-cliente').fill('Mamani');
    await page.getByTestId('opcion-cliente').first().click();

    await page.getByRole('button', { name: 'Revisar venta' }).click();
    await expect(page.getByText('Agregue al menos un producto')).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'Confirmar venta' })).toHaveCount(0);
    expect(posts).toBe(0);
  });
});
