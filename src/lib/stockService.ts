import { db } from '@/lib/db';
import { StockEvent, StockEventReason } from '@/types';

// Outbox pattern for queueing offline transactions
export async function queueOutboxAction(businessId: string, action: string, table: string, payload: any) {
  const id = `outbox_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  await db.outbox.put({
    id,
    businessId,
    action,
    table,
    payload,
    createdAt: new Date().toISOString(),
    status: 'pending',
  });
  return id;
}

// Record stock movement (append-only ledger principle)
export async function recordStockEvent(
  businessId: string,
  productId: string,
  deltaCartons: number,
  reason: StockEventReason,
  createdBy: string,
  sourceId?: string,
  notes?: string
) {
  const eventId = `stock_evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const event: StockEvent = {
    id: eventId,
    businessId,
    productId,
    deltaCartons,
    reason,
    sourceId,
    notes,
    createdBy,
    createdAt: new Date().toISOString(),
    synced: false,
  };

  // Update local DB atomically
  await db.transaction('rw', db.stockEvents, db.products, db.outbox, async () => {
    await db.stockEvents.put(event);
    
    // Update product cached stock count
    const product = await db.products.get(productId);
    if (product) {
      const newStock = (product.stockCount || 0) + deltaCartons;
      await db.products.update(productId, { stockCount: Math.max(0, newStock) });
    }

    // Add to outbox for later sync
    await queueOutboxAction(businessId, 'INSERT', 'stock_events', event);
  });

  return event;
}

// Format Currency in Nigerian Naira (NGN)
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount);
}
