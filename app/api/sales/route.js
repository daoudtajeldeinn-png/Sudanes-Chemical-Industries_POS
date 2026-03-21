import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Sale from '@/models/Sale';
import Product from '@/models/Product';
import ProductStock from '@/models/ProductStock';
import StockMovement from '@/models/StockMovement';
import Customer from '@/models/Customer';
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
    const sales = await Sale.find(filter)
      .populate('customer', 'customerName customerCode phone')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
    return NextResponse.json({ sales });
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

    // Get default warehouse if not specified
    if (!body.warehouse) {
      const wh = await Warehouse.findOne({ isDefault: true }).session(session);
      if (wh) body.warehouse = wh._id;
    }

    // Process items, update stock and batches
    let subTotal = 0;
    const items = [];

    for (const item of body.items) {
      const product = await Product.findById(item.product).session(session);
      if (!product) throw new Error(`Product not found: ${item.product}`);

      const totalPrice = (item.quantity * item.unitPrice) - (item.discount || 0);
      const taxAmount = totalPrice * ((item.taxRate || 0) / 100);
      const finalPrice = totalPrice + taxAmount;
      subTotal += finalPrice;

      // 1. Manage Batch (Automatic FEFO if no batchId provided)
      let batchId = item.batchId;
      if (!batchId) {
        // Find the soonest-to-expire batch with enough stock
        const bestBatch = await Batch.findOne({ 
          product: item.product, 
          warehouse: body.warehouse, 
          currentQty: { $gte: item.quantity },
          status: 'Active'
        }).sort({ expiryDate: 1 }).session(session);

        if (!bestBatch) {
          throw new Error(`ليست هناك كمية كافية من أي تشغيلة (Batch) نشطة للمنتج ${product.productCode}`);
        }
        batchId = bestBatch._id;
      }

      const batch = await Batch.findById(batchId).session(session);
      if (!batch) throw new Error(`Batch not found: ${batchId}`);
      if (batch.currentQty < item.quantity) {
        throw new Error(`Insufficient stock in batch ${batch.batchNumber}: Available ${batch.currentQty}, Required ${item.quantity}`);
      }
      batch.currentQty -= item.quantity;
      if (batch.currentQty <= 0) batch.status = 'Empty';
      await batch.save({ session });

      items.push({
        ...item,
        productCode: product.productCode,
        productName: product.productNameAr || product.productName,
        costPrice: product.costPrice || 0,
        taxAmount,
        totalPrice: finalPrice,
      });

      // 2. Update stock OUT (using specific batch if applicable)
      const stock = await ProductStock.findOne({ 
        product: item.product, 
        warehouse: body.warehouse, 
        batchId: item.batchId || null 
      }).session(session);

      if (!stock || stock.quantity < item.quantity) {
        throw new Error(`Insufficient stock for product ${product.productCode} in target warehouse/batch.`);
      }

      stock.quantity -= item.quantity;
      await stock.save({ session });

      // 3. Record movements
      await StockMovement.create([{
        product: item.product,
        warehouse: body.warehouse,
        batchId: item.batchId || null,
        movementType: 'OUT',
        referenceType: body.type === 'ISSUE' ? 'CONSUMPTION' : 'SALE',
        quantity: -item.quantity,
        unitCost: product.costPrice,
        user: user.id,
      }], { session });
    }

    body.items = items;
    body.subTotal = subTotal;

    // Skip financial logic for Internal Issuing
    if (body.type === 'ISSUE') {
      body.discountAmount = 0;
      body.taxAmount = 0;
      body.totalAmount = subTotal;
      body.paidAmount = subTotal;
      body.paymentMethod = 'CASH';
      body.status = 'PAID';
    } else {
      // Apply invoice-level discount
      if (body.discountType === 'PERCENT') {
        body.discountAmount = subTotal * (body.discountValue / 100);
      }
      body.totalAmount = subTotal - (body.discountAmount || 0) + (body.taxAmount || 0);
      body.remainingAmount = body.totalAmount - (body.paidAmount || 0);

      if (body.paidAmount >= body.totalAmount) body.status = 'PAID';
      else if (body.paidAmount > 0) body.status = 'PARTIAL';
      else if (body.paymentMethod === 'CREDIT') body.status = 'CREDIT';
    }

    // Generate a simple QR code string
    const qrData = {
      n: 'SCI',
      i: body.invoiceNumber || 'NEW',
      d: new Date().toISOString(),
      t: body.totalAmount,
      x: body.taxAmount || 0
    };
    body.qrCode = Buffer.from(JSON.stringify(qrData)).toString('base64');

    const sale = await Sale.create([body], { session });

    // Update customer balance if credit/remaining (only for real sales)
    if (body.type !== 'ISSUE' && body.customer && body.remainingAmount > 0) {
      await Customer.findByIdAndUpdate(body.customer, { $inc: { currentBalance: body.remainingAmount } }).session(session);
    }

    await session.commitTransaction();
    return NextResponse.json({ sale: sale[0] }, { status: 201 });
  } catch (err) {
    await session.abortTransaction();
    return NextResponse.json({ error: err.message }, { status: 400 });
  } finally {
    session.endSession();
  }
}
