import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Sale from '@/models/Sale';
import Product from '@/models/Product';
import ProductStock from '@/models/ProductStock';
import Customer from '@/models/Customer';
import Supplier from '@/models/Supplier';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = getAuthUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();

    const today = new Date(); today.setHours(0,0,0,0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);

    const [todaySales, monthSales, totalProducts, totalCustomers, totalSuppliers, recentSales, monthlySalesData, lowStockItems] = await Promise.all([
      Sale.aggregate([{ $match: { invoiceDate: { $gte: today }, status: { $ne: 'CANCELLED' } } }, { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }]),
      Sale.aggregate([{ $match: { invoiceDate: { $gte: monthStart }, status: { $ne: 'CANCELLED' } } }, { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }]),
      Product.countDocuments({ isActive: true }),
      Customer.countDocuments({ isActive: true }),
      Supplier.countDocuments({ isActive: true }),
      Sale.find({ status: { $ne: 'CANCELLED' } }).sort({ createdAt: -1 }).limit(5).populate('customer', 'customerName'),
      Sale.aggregate([
        { $match: { invoiceDate: { $gte: sixMonthsAgo }, status: { $ne: 'CANCELLED' } } },
        { $group: { _id: { year: { $year: '$invoiceDate' }, month: { $month: '$invoiceDate' } }, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      // Low stock: products where stock <= minStock
      ProductStock.aggregate([
        { $group: { _id: '$product', totalQty: { $sum: '$quantity' } } },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
        { $unwind: '$product' },
        { $match: { $expr: { $lte: ['$totalQty', '$product.minStock'] }, 'product.isActive': true } },
        { $count: 'count' }
      ]),
    ]);

    return NextResponse.json({
      todayTotal: todaySales[0]?.total || 0,
      todayCount: todaySales[0]?.count || 0,
      monthTotal: monthSales[0]?.total || 0,
      monthCount: monthSales[0]?.count || 0,
      totalProducts,
      lowStockCount: lowStockItems[0]?.count || 0,
      totalCustomers,
      totalSuppliers,
      recentSales,
      monthlySalesData,
    });
  } catch (err) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
