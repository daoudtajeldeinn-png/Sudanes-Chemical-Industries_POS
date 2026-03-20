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

    // Units (from SQL)
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

    // Categories (Pharmaceutical)
    const catData = [
      { categoryName: 'Analgesics', categoryNameAr: 'مسكنات' },
      { categoryName: 'Antibiotics', categoryNameAr: 'مضادات حيوية' },
      { categoryName: 'Antipyretics', categoryNameAr: 'خافضات حرارة' },
      { categoryName: 'Vitamins', categoryNameAr: 'فيتامينات' },
      { categoryName: 'Dermatologicals', categoryNameAr: 'جلدية' },
      { categoryName: 'Raw Materials', categoryNameAr: 'مواد خام' },
      { categoryName: 'Packaging', categoryNameAr: 'مواد تعبئة وتغليف' },
    ];
    const cats = {};
    for (const c of catData) {
      const cat = await Category.findOneAndUpdate({ categoryName: c.categoryName }, { ...c, isActive: true }, { upsert: true, new: true });
      cats[c.categoryName] = cat._id;
    }

    // Customer groups (from SQL)
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

    // Expense categories (from SQL)
    const expCats = ['إيجار','رواتب','كهرباء وماء','صيانة','مواصلات','اتصالات','مصروفات إدارية','أخرى'];
    for (const name of expCats) {
      await ExpenseCategory.findOneAndUpdate({ categoryName: name }, { categoryName: name, isActive: true }, { upsert: true });
    }

    // Suppliers (from SQL)
    const sup1 = await Supplier.findOneAndUpdate({ supplierCode: 'SUPP-001' },
      { supplierCode: 'SUPP-001', supplierName: 'شركة الخليج للكيماويات', phone: '+966501234567', city: 'الرياض', country: 'Saudi Arabia', isActive: true },
      { upsert: true, new: true });
    const sup2 = await Supplier.findOneAndUpdate({ supplierCode: 'SUPP-002' },
      { supplierCode: 'SUPP-002', supplierName: 'مصنع النيل للمواد الكيميائية', phone: '+249912345678', city: 'الخرطوم', country: 'Sudan', isActive: true },
      { upsert: true, new: true });

    // Products (Specific SCI Pharmaceuticals)
    const products = [
      { productCode: 'SCI-001', productName: 'Asprona 100mg', productNameAr: 'اسبرونا 100ملجم', category: cats['Analgesics'], unit: units['PCS'], costPrice: 50, wholesalePrice: 70, retailPrice: 100, taxRate: 0, minStock: 100 },
      { productCode: 'SCI-002', productName: 'Asprona 300', productNameAr: 'اسبرونا 300', category: cats['Analgesics'], unit: units['PCS'], costPrice: 80, wholesalePrice: 110, retailPrice: 150, taxRate: 0, minStock: 100 },
      { productCode: 'SCI-003', productName: 'Asprona 75', productNameAr: 'اسبرونا 75', category: cats['Analgesics'], unit: units['PCS'], costPrice: 40, wholesalePrice: 55, retailPrice: 80, taxRate: 0, minStock: 100 },
      { productCode: 'SCI-004', productName: 'Potassium Citrate Eff. 16%', productNameAr: 'سترات البوتاسيم الفوارة 16%', category: cats['Vitamins'], unit: units['PCS'], costPrice: 150, wholesalePrice: 200, retailPrice: 250, taxRate: 0, minStock: 50 },
      { productCode: 'SCI-005', productName: 'Trichocid 500mg', productNameAr: 'ترايكوسيد 500 ملجم Trichocid500mg', category: cats['Antibiotics'], unit: units['BOX'], costPrice: 800, wholesalePrice: 1100, retailPrice: 1400, taxRate: 0, minStock: 30 },
      { productCode: 'SCI-006', productName: 'Parmol 500mg', productNameAr: 'بارمول 500ملجم', category: cats['Antipyretics'], unit: units['PCS'], costPrice: 30, wholesalePrice: 45, retailPrice: 60, taxRate: 0, minStock: 200 },
      { productCode: 'SCI-007', productName: 'Povidin Iodine 10%', productNameAr: 'بوفيدين ايودين', category: cats['Dermatologicals'], unit: units['BOX'], costPrice: 1200, wholesalePrice: 1600, retailPrice: 2000, taxRate: 0, minStock: 50 },
      { productCode: 'RAW-001', productName: 'Talc Powder', productNameAr: 'بودرة تالك', category: cats['Raw Materials'], unit: units['KG'], costPrice: 25, wholesalePrice: 35, retailPrice: 45, currency: 'USD', exchangeRate: 600, taxRate: 0, minStock: 500 },
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

    // Customers (from SQL pattern)
    const custData = [
      { customerCode: 'CUST-001', customerName: 'عميل نقدي', phone: '0500000000', group: groups['عميل عادي'] },
      { customerCode: 'CUST-002', customerName: 'شركة المياه الوطنية', phone: '+249912000001', city: 'الخرطوم', group: groups['عميل مميز'], creditLimit: 500000 },
      { customerCode: 'CUST-003', customerName: 'مصنع الغزل والنسيج', phone: '+249912000002', city: 'أم درمان', group: groups['عميل جملة'], creditLimit: 200000 },
      { customerCode: 'CUST-004', customerName: 'شركة الزراعة والري', phone: '+249912000004', city: 'مدني', group: groups['موزع معتمد'], creditLimit: 300000 },
    ];
    for (const c of custData) {
      await Customer.findOneAndUpdate({ customerCode: c.customerCode }, { ...c, isActive: true }, { upsert: true });
    }

    return NextResponse.json({ ok: true, message: 'تم إضافة البيانات التجريبية بنجاح! ✅' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
