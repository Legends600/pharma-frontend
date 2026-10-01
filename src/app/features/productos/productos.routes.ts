import { Routes } from '@angular/router';
import { ProductoList } from './pages/producto-list/producto-list';

export const PRODUCTOS_ROUTES: Routes = [
  { path: '', component: ProductoList, title: 'Productos' },
];
