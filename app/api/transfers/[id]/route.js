import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Transfer from '@/models/Transfer';
import ProductStock from '@/models/ProductStock';
import StockMovement from '@/models/StockMovement';
import mongoose from 'mongoose';
import { getAuthUser } from '@/lib/auth';

export async function PUT(req, { params }) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const user = getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { id } = params;
    const { status } = await req.json();

    const transfer = await Transfer.findById(id);
    if (!transfer) throw new Error('Transfer not found');

    const oldStatus = transfer.status;
    transfer.status = status;
    if (status === 'SENT') transfer.sentAt = new Date();
    if (status === 'RECEIVED') transfer.receivedAt = new Date();
    await transfer.save({ session });

    // IF RECEIVED: Adjust Inventory
    if (status === 'RECEIVED' && oldStatus !== 'RECEIVED') {
      for (const item of transfer.items) {
        // 1. Deduct from Source
        await ProductStock.findOneAndUpdate(
          { product: item.product, warehouse: transfer.fromWarehouse },
          { $inc: { quantity: -item.quantity } },
          { session, upsert: true }
        );
        // 2. Add to Destination
        await ProductStock.findOneAndUpdate(
          { product: item.product, warehouse: transfer.toWarehouse },
          { $inc: { quantity: item.quantity } },
          { session, upsert: true }
        );

        // Record Movements
        await StockMovement.create([
          {
            product: item.product,
            warehouse: transfer.fromWarehouse,
            movementType: 'OUT',
            referenceType: 'TRANSFER',
            quantity: -item.quantity,
            user: user.id,
            notes: `تحويل صادر إلى: ${transfer.toWarehouse}`
          },
          {
            product: item.product,
            warehouse: transfer.toWarehouse,
            movementType: 'IN',
            referenceType: 'TRANSFER',
            quantity: item.quantity,
            user: user.id,
            notes: `تحويل وارد من: ${transfer.fromWarehouse}`
          }
        ], { session });
      }
    }

    await session.commitTransaction();
    return NextResponse.json({ transfer });
  } catch (err) {
    await session.abortTransaction();
    return NextResponse.json({ error: err.message }, { status: 400 });
  } finally {
    session.endSession();
  }
}
