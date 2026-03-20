import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Purchase from '@/models/Purchase';
import Product from '@/models/Product';
import ProductStock from '@/models/ProductStock';
import StockMovement from '@/models/StockMovement';
import Supplier from '@/models/Supplier';
import Warehouse from '@/models/Warehouse';
import Batch from '@/models/Batch';
import { getAuthUser } from '@/lib/auth';

export async function GET(req) {
  try {
    const user = getAuthUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const filter = {};
    if (from || to) {
      filter.invoiceDate = {};
      if (from) filter.invoiceDate.$gte = new Date(from);
      if (to) filter.invoiceDate.$lte = new Date(to + 'T23:59:59');
    }
    const purchases = await Purchase.find(filter)
      .populate('supplier', 'supplierName supplierCode')
      .sort({ createdAt: -1 })
      .limit(300);
    return NextResponse.json({ purchases });
  } catch (err) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function POST(req) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const user = getAuthUser(); 
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    await connectDB();
    const body = await req.json();
    body.user = user.id;

    if (!body.warehouse) {
      const wh = await Warehouse.findOne({ isDefault: true }).session(session);
      if (wh) body.warehouse = wh._id;
    }

    // Calculate totals and handle batches
    let subTotal = 0;
    const items = [];

    for (const item of body.items) {
      const product = await Product.findById(item.product).session(session);
      if (!product) throw new Error(`Product not found: ${item.product}`);

      const taxAmount = item.unitCost * item.quantity * ((item.taxRate || 0) / 100);
      const totalCost = (item.unitCost * item.quantity) + taxAmount;
      subTotal += totalCost;

      // 1. Manage Batch if provided
      let batchId = item.batchId;
      if (item.batchNumber && item.expiryDate) {
        // Try to find existing batch or create new one
        let batch = await Batch.findOne({ 
          batchNumber: item.batchNumber, 
          product: item.product, 
          warehouse: body.warehouse 
        }).session(session);

        if (batch) {
          batch.currentQty += item.quantity;
          batch.purchasePrice = item.unitCost;
          await batch.save({ session });
        } else {
          batch = await Batch.create([{
            batchNumber: item.batchNumber,
            product: item.product,
            warehouse: body.warehouse,
            expiryDate: new Date(item.expiryDate),
            initialQty: item.quantity,
            currentQty: item.quantity,
            purchasePrice: item.unitCost
          }], { session });
          batch = batch[0];
        }
        batchId = batch._id;
      }

      items.push({
        ...item,
        batchId,
        productCode: product.productCode,
        productName: product.productNameAr || product.productName,
        taxAmount,
        totalCost,
      });

      // 2. Update stock IN
      await ProductStock.findOneAndUpdate(
        { product: item.product, warehouse: body.warehouse, batchId: batchId || null },
        { $inc: { quantity: item.quantity } },
        { upsert: true, session }
      );

      // 3. Record movements
      await StockMovement.create([{
        product: item.product,
        warehouse: body.warehouse,
        batchId: batchId || null,
        movementType: 'IN',
        referenceType: 'PURCHASE',
        quantity: item.quantity,
        unitCost: item.unitCost,
        user: user.id,
      }], { session });

      // 4. Update product last cost price
      await Product.findByIdAndUpdate(item.product, { costPrice: item.unitCost }).session(session);
    }

    body.items = items;
    body.subTotal = subTotal;
    body.totalAmount = subTotal - (body.discountAmount || 0) + (body.taxAmount || 0);
    body.remainingAmount = body.totalAmount - (body.paidAmount || 0);

    const purchase = await Purchase.create([body], { session });

    // Update supplier balance
    if (body.remainingAmount > 0) {
      await Supplier.findByIdAndUpdate(body.supplier, { $inc: { currentBalance: body.remainingAmount } }).session(session);
    }

    await session.commitTransaction();
    return NextResponse.json({ purchase: purchase[0] }, { status: 201 });
  } catch (err) {
    await session.abortTransaction();
    return NextResponse.json({ error: err.message }, { status: 400 });
  } finally {
    session.endSession();
  }
}
