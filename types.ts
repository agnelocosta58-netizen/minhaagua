/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GallonInventory {
  full: number;
  empty: number;
  totalCap: number; // Max storage capacity
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  createdAt: number;
}

export interface StockBatch {
  year: number;
  full: number;
  empty: number;
}

export interface Product {
  id: string;
  name: string;
  size: string;
  expiryDate?: string;
  costPrice: number;
  retailPrice: number;
  resalePrice: number;
  salePrice?: number; // Added for extra compatibility
  stock?: number;     // Added for extra compatibility
  batches: StockBatch[];
}


export type PaymentMethod = 'dinheiro' | 'pix' | 'credito' | 'debito';

export interface Sale {
  id: string;
  customerId: string;
  customerName: string;
  productId: string;
  productName: string;
  quantity: number;
  batchYear?: number;
  borrowedQuantity?: number;
  borrowedBatchYear?: number;
  amount: number;
  paymentMethod: PaymentMethod;
  date: number;
  status: 'delivered' | 'pending' | 'cancelled';
}

export interface AppData {
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  inventory: GallonInventory; // Still used for global capacity tracking maybe
  unitPrice: number; // Legacy, can be phase out or used as default
  pixKey?: string;
  pixName?: string;
  pixCity?: string;
  adminPassword?: string;
  bottleReturns: BottleReturn[];
  users: User[];
}

export type UserRole = 'admin' | 'seller';

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
}

export interface BottleReturn {
  id: string;
  customerId: string;
  customerName: string;
  productId: string;
  productName: string;
  quantity: number;
  batchYear: number;
  date: number;
}
