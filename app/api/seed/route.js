import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Product from '@/models/Product';
import Customer from '@/models/Customer';
import CustomerGroup from '@/models/CustomerGroup';
import Supplier from '@/models/Supplier';
import Category from '@/models/Category';
import Unit from '@/models/Unit';
import Warehouse from '@/models/Warehouse';
import ProductStock from '@/models/ProductStock';
import CompanySettings from '@/models/CompanySettings';
import { ExpenseCategory } from '@/models/Expense';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    await connectDB();

    // Create Admin User (Using .save() or .create() to trigger hashing hook)
    let admin = await User.findOne({ username: 'admin' });
    if (admin) {
      admin.passwordHash = 'admin@123';
      admin.fullName = 'Director Admin';
      admin.email = 'admin@sci.sd';
      admin.roleName = 'مدير النظام';
      await admin.save();
    } else {
      await User.create({
        username: 'admin',
        passwordHash: 'admin@123',
        fullName: 'Director Admin',
        email: 'admin@sci.sd',
        roleName: 'مدير النظام'
      });
    }

    // Company settings
    await CompanySettings.findOneAndUpdate({}, {
      companyName: 'Sudanese Chemical Industries',
      companyNameAr: 'الصناعات الكيميائية السودانية',
      phone: '+249912345678',
      email: 'info@sci.sd',
      address: 'الخرطوم، السودان',
      taxRate: 0,
      currency: 'SDG',
      currencyCode: 'SDG',
      invoiceHeader: 'الصناعات الكيميائية السودانية',
      invoiceFooter: 'شكراً لتعاملكم معنا',
    }, { upsert: true });

    // Default warehouse
    const warehouse = await Warehouse.findOneAndUpdate(
      { warehouseName: 'المخزن الرئيسي' },
      { warehouseName: 'المخزن الرئيسي', location: 'الخرطوم - المقر الرئيسي', isDefault: true, isActive: true },
      { upsert: true, new: true }
    );

    // Units
    const unitData = [
      { unitName: 'قطعة', unitCode: 'PCS' },
      { unitName: 'كيلو', unitCode: 'KG' },
      { unitName: 'لتر', unitCode: 'L' },
      { unitName: 'متر', unitCode: 'M' },
      { unitName: 'كرتون', unitCode: 'CTN' },
      { unitName: 'صندوق', unitCode: 'BOX' },
      { unitName: 'طن', unitCode: 'TON' },
    ];
    const units = {};
    for (const u of unitData) {
      const unit = await Unit.findOneAndUpdate({ unitCode: u.unitCode }, { ...u, isActive: true }, { upsert: true, new: true });
      units[u.unitCode] = unit._id;
    }

    // Categories (SCI Classification)
    const catData = [
      { categoryName: 'Finished Products', categoryNameAr: 'منتجات نهائية' },
      { categoryName: 'Active Raw Materials', categoryNameAr: 'مواد خام فعالة' },
      { categoryName: 'Inactive Raw Materials', categoryNameAr: 'مواد خام غير فعالة' },
      { categoryName: 'Packaging Materials', categoryNameAr: 'مواد تعبئة وتغليف' },
      { categoryName: 'Admin & Consumables', categoryNameAr: 'وقود ومواد غذائية ومنصرفات' },
    ];
    const cats = {};
    for (const c of catData) {
      const cat = await Category.findOneAndUpdate({ categoryName: c.categoryName }, { ...c, isActive: true }, { upsert: true, new: true });
      cats[c.categoryName] = cat._id;
    }

    // Products (Specific SCI Pharmaceuticals)
    const products = [
      { productCode: 'SCI-001', productName: 'Asprona 100mg', productNameAr: 'اسبرونا 100ملجم', category: cats['Finished Products'], unit: units['PCS'], costPrice: 50, wholesalePrice: 70, retailPrice: 100, taxRate: 0, minStock: 100 },
      { productCode: 'SCI-002', productName: 'Asprona 300', productNameAr: 'اسبرونا 300', category: cats['Finished Products'], unit: units['PCS'], costPrice: 80, wholesalePrice: 110, retailPrice: 150, taxRate: 0, minStock: 100 },
      { productCode: 'SCI-003', productName: 'Asprona 75', productNameAr: 'اسبرونا 75', category: cats['Finished Products'], unit: units['PCS'], costPrice: 40, wholesalePrice: 55, retailPrice: 80, taxRate: 0, minStock: 100 },
      { productCode: 'SCI-004', productName: 'Trichocid 500mg', productNameAr: 'ترايكوسيد 500 ملجم Trichocid500mg', category: cats['Finished Products'], unit: units['BOX'], costPrice: 800, wholesalePrice: 1100, retailPrice: 1400, taxRate: 0, minStock: 30 },
      { productCode: 'RAW-ACT-001', productName: 'Aspirin Powder (Active)', productNameAr: 'بودرة أسبرين (خام فعال)', category: cats['Active Raw Materials'], unit: units['KG'], costPrice: 20, wholesalePrice: 30, retailPrice: 40, currency: 'USD', exchangeRate: 600, taxRate: 0, minStock: 500 },
      { productCode: 'RAW-INA-001', productName: 'Talcum Powder', productNameAr: 'بودرة تالك (غير فعالة)', category: cats['Inactive Raw Materials'], unit: units['KG'], costPrice: 5, wholesalePrice: 10, retailPrice: 15, currency: 'USD', exchangeRate: 600, taxRate: 0, minStock: 1000 },
      { productCode: 'PACK-001', productName: 'Empty Glass Bottle', productNameAr: 'عبوات زجاجية فارغة', category: cats['Packaging Materials'], unit: units['PCS'], costPrice: 200, wholesalePrice: 300, retailPrice: 400, taxRate: 0, minStock: 10000 },
      { productCode: 'FUEL-001', productName: 'Diesel (Stock)', productNameAr: 'ديزل (وقود)', category: cats['Admin & Consumables'], unit: units['L'], costPrice: 1500, wholesalePrice: 1800, retailPrice: 2000, taxRate: 0, minStock: 200 },
    ];

    for (const p of products) {
      const prod = await Product.findOneAndUpdate({ productCode: p.productCode }, { ...p, isActive: true }, { upsert: true, new: true });
      // Stock
      const qty = Math.floor(Math.random() * 400) + 50;
      await ProductStock.findOneAndUpdate(
        { product: prod._id, warehouse: warehouse._id },
        { product: prod._id, warehouse: warehouse._id, quantity: qty },
        { upsert: true }
      );
    }

    // Customer groups
    const groupData = [
      { groupName: 'عميل عادي', discountRate: 0, creditLimit: 0 },
      { groupName: 'عميل جملة', discountRate: 5, creditLimit: 500000 },
      { groupName: 'عميل مميز', discountRate: 10, creditLimit: 1000000 },
      { groupName: 'موزع معتمد', discountRate: 15, creditLimit: 2000000 },
    ];
    const groups = {};
    for (const g of groupData) {
      const grp = await CustomerGroup.findOneAndUpdate({ groupName: g.groupName }, { ...g, isActive: true }, { upsert: true, new: true });
      groups[g.groupName] = grp._id;
    }

    // Expense categories
    const expCats = ['إيجار','رواتب','كهرباء وماء','صيانة','مواصلات','اتصالات','مصروفات إدارية','أخرى','وقود','غذاء'];
    for (const name of expCats) {
      await ExpenseCategory.findOneAndUpdate({ categoryName: name }, { categoryName: name, isActive: true }, { upsert: true });
    }

    // Suppliers
    await Supplier.findOneAndUpdate({ supplierCode: 'SUPP-001' },
      { supplierCode: 'SUPP-001', supplierName: 'Gulf Chemicals Co.', phone: '+966501234567', city: 'Riyadh', country: 'KSA', isActive: true },
      { upsert: true });
    await Supplier.findOneAndUpdate({ supplierCode: 'SUPP-002' },
      { supplierCode: 'SUPP-002', supplierName: 'Nile Chemical Factory', phone: '+249912345678', city: 'Khartoum', country: 'Sudan', isActive: true },
      { upsert: true });

    return NextResponse.json({ ok: true, message: 'تم إضافة البيانات التجريبية بنجاح! ✅' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
