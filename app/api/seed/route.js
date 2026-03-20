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

export async function POST() {
  try {
    const user = getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();

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

    // Categories (from SQL)
    const catData = [
      { categoryName: 'Acids', categoryNameAr: 'أحماض' },
      { categoryName: 'Bases', categoryNameAr: 'قواعد' },
      { categoryName: 'Solvents', categoryNameAr: 'مذيبات' },
      { categoryName: 'Fertilizers', categoryNameAr: 'أسمدة' },
      { categoryName: 'Chlorine', categoryNameAr: 'كلور' },
      { categoryName: 'Polymers', categoryNameAr: 'بوليمرات' },
      { categoryName: 'Pigments', categoryNameAr: 'أصباغ' },
      { categoryName: 'Raw Materials', categoryNameAr: 'مواد خام' },
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

    // Products (chemical - matching the company domain)
    const products = [
      { productCode: 'ACID-001', productName: 'Sulfuric Acid 98%', productNameAr: 'حمض الكبريتيك 98%', category: cats['Acids'], unit: units['KG'], costPrice: 150, wholesalePrice: 200, retailPrice: 250, taxRate: 0, minStock: 50 },
      { productCode: 'ACID-002', productName: 'Hydrochloric Acid 32%', productNameAr: 'حمض الهيدروكلوريك 32%', category: cats['Acids'], unit: units['L'], costPrice: 80, wholesalePrice: 120, retailPrice: 150, taxRate: 0, minStock: 30 },
      { productCode: 'ACID-003', productName: 'Nitric Acid 65%', productNameAr: 'حمض النيتريك 65%', category: cats['Acids'], unit: units['L'], costPrice: 200, wholesalePrice: 290, retailPrice: 350, taxRate: 0, minStock: 20 },
      { productCode: 'BASE-001', productName: 'Sodium Hydroxide', productNameAr: 'هيدروكسيد الصوديوم', category: cats['Bases'], unit: units['KG'], costPrice: 200, wholesalePrice: 300, retailPrice: 370, taxRate: 0, minStock: 25 },
      { productCode: 'BASE-002', productName: 'Potassium Hydroxide', productNameAr: 'هيدروكسيد البوتاسيوم', category: cats['Bases'], unit: units['KG'], costPrice: 350, wholesalePrice: 500, retailPrice: 600, taxRate: 0, minStock: 15 },
      { productCode: 'SOLV-001', productName: 'Ethanol 95%', productNameAr: 'إيثانول 95%', category: cats['Solvents'], unit: units['L'], costPrice: 120, wholesalePrice: 170, retailPrice: 210, taxRate: 0, minStock: 40 },
      { productCode: 'SOLV-002', productName: 'Acetone', productNameAr: 'أسيتون', category: cats['Solvents'], unit: units['L'], costPrice: 95, wholesalePrice: 140, retailPrice: 175, taxRate: 0, minStock: 20 },
      { productCode: 'FERT-001', productName: 'Urea 46%', productNameAr: 'يوريا 46%', category: cats['Fertilizers'], unit: units['TON'], costPrice: 45000, wholesalePrice: 58000, retailPrice: 65000, taxRate: 0, minStock: 5 },
      { productCode: 'FERT-002', productName: 'Ammonium Sulfate', productNameAr: 'كبريتات الأمونيوم', category: cats['Fertilizers'], unit: units['TON'], costPrice: 30000, wholesalePrice: 40000, retailPrice: 48000, taxRate: 0, minStock: 5 },
      { productCode: 'CHLR-001', productName: 'Chlorine Gas', productNameAr: 'غاز الكلور', category: cats['Chlorine'], unit: units['KG'], costPrice: 180, wholesalePrice: 250, retailPrice: 310, taxRate: 0, minStock: 20 },
      { productCode: 'CHLR-002', productName: 'Sodium Hypochlorite', productNameAr: 'هيبوكلوريت الصوديوم', category: cats['Chlorine'], unit: units['L'], costPrice: 45, wholesalePrice: 65, retailPrice: 85, taxRate: 0, minStock: 50 },
      { productCode: 'POLM-001', productName: 'Polyethylene Granules', productNameAr: 'حبيبات بولي إيثيلين', category: cats['Polymers'], unit: units['KG'], costPrice: 280, wholesalePrice: 380, retailPrice: 450, taxRate: 0, minStock: 100 },
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
