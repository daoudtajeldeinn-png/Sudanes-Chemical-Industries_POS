import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Sale from '@/models/Sale';
import ProductStock from '@/models/ProductStock';
import StockMovement from '@/models/StockMovement';
import Customer from '@/models/Customer';
import Batch from '@/models/Batch';
import { getAuthUser } from '@/lib/auth';

export async function POST(req, { params }) {
  const { id } = params;
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const user = getAuthUser(); 
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    await connectDB();
    const sale = await Sale.findById(id).session(session);
    
    if (!sale) throw new Error('Sale not found');
    if (sale.status === 'CANCELLED') throw new Error('Sale is already cancelled');

    // 1. Reverse Stock and Batches
    for (const item of sale.items) {
      // Update Batch if applicable
      if (item.batchId) {
        await Batch.findByIdAndUpdate(item.batchId, { 
          $inc: { currentQty: item.quantity },
          $set: { status: 'Active' } 
        }).session(session);
      }

      // Update ProductStock
      await ProductStock.findOneAndUpdate(
        { product: item.product, warehouse: sale.warehouse, batchId: item.batchId || null },
        { $inc: { quantity: item.quantity } },
        { upsert: true, session }
      );

      // Record Cancellation Movement
      await StockMovement.create([{
        product: item.product,
        warehouse: sale.warehouse,
        batchId: item.batchId || null,
        movementType: 'IN',
        referenceType: 'CANCEL',
        referenceId: sale._id,
        quantity: item.quantity,
        unitCost: item.costPrice,
        user: user.id,
        notes: 'Invoice Cancellation'
      }], { session });
    }

    // 2. Reverse Customer Balance if applicable
    if (sale.customer && sale.remainingAmount > 0) {
      await Customer.findByIdAndUpdate(sale.customer, { 
        $inc: { currentBalance: -sale.remainingAmount } 
      }).session(session);
    }

    // 3. Mark Sale as CANCELLED
    sale.status = 'CANCELLED';
    await sale.save({ session });

    await session.commitTransaction();
    return NextResponse.json({ message: 'Sale cancelled successfully', sale });
  } catch (err) {
    await session.abortTransaction();
    return NextResponse.json({ error: err.message }, { status: 400 });
  } finally {
    session.endSession();
  }
}
