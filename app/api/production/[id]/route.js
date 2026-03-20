import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ProductionOrder from '@/models/ProductionOrder';
import Recipe from '@/models/Recipe';
import ProductStock from '@/models/ProductStock';
import StockMovement from '@/models/StockMovement';
import Batch from '@/models/Batch';
import mongoose from 'mongoose';
import { getAuthUser } from '@/lib/auth';

export async function PUT(req, { params }) {
  await connectDB();
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const user = getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = params;
    const { status, actualQty } = await req.json();

    const order = await ProductionOrder.findById(id).populate('recipe');
    if (!order) throw new Error('Order not found');

    const oldStatus = order.status;
    order.status = status;
    if (actualQty) order.actualQty = actualQty;
    if (status === 'COMPLETED') order.endDate = new Date();
    
    await order.save({ session });

    // IF COMPLETED: Execute Inventory Sync
    if (status === 'COMPLETED' && oldStatus !== 'COMPLETED') {
      const recipe = await Recipe.findById(order.recipe._id).populate('ingredients.product');
      const ratio = order.actualQty / (recipe.standardBatchSize || 1);

      // 1. Deduct Raw Materials
      for (const ing of recipe.ingredients) {
        const qtyToDeduct = ing.quantity * ratio;
        
        // Update stock (Simplified: assume FIFO/General deduction if no batch chosen for ingredients yet)
        await ProductStock.findOneAndUpdate(
          { product: ing.product._id, warehouse: order.warehouse },
          { $inc: { quantity: -qtyToDeduct } },
          { session, upsert: true }
        );

        await StockMovement.create([{
          product: ing.product._id,
          warehouse: order.warehouse,
          movementType: 'OUT',
          referenceType: 'PRODUCTION',
          quantity: -qtyToDeduct,
          unitCost: ing.product.costPrice || 0,
          user: user.id,
          notes: `استهلاك للتشغيلة: ${order.batchNumber}`
        }], { session });
      }

      // 2. Add Finished Product
      await ProductStock.findOneAndUpdate(
        { product: order.finishedProduct, warehouse: order.warehouse },
        { $inc: { quantity: order.actualQty } },
        { session, upsert: true }
      );

      // Create a batch for the finished product
      await Batch.create([{
        product: order.finishedProduct,
        warehouse: order.warehouse,
        batchNumber: order.batchNumber,
        initialQty: order.actualQty,
        currentQty: order.actualQty,
        productionDate: order.startDate || new Date(),
        expiryDate: new Date(Date.now() + 365 * 2 * 24 * 60 * 60 * 1000), // Default 2 years
      }], { session });

      await StockMovement.create([{
        product: order.finishedProduct,
        warehouse: order.warehouse,
        movementType: 'IN',
        referenceType: 'PRODUCTION',
        quantity: order.actualQty,
        user: user.id,
        notes: `إنتاج تشغيلة رقم: ${order.batchNumber}`
      }], { session });
    }

    await session.commitTransaction();
    return NextResponse.json({ order });
  } catch (err) {
    await session.abortTransaction();
    return NextResponse.json({ error: err.message }, { status: 400 });
  } finally {
    session.endSession();
  }
}
