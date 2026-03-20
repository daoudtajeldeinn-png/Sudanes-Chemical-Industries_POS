'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ paymentMethod: 'CASH', status: 'PAID', items: [] });

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    fetch(`/api/purchases?${params}`).then(r => r.json()).then(d => { setPurchases(d.purchases || []); setLoading(false); });
  };

  useEffect(() => { load(); }, [from, to]);
  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(d => setProducts(d.products || []));
    fetch('/api/suppliers').then(r => r.json()).then(d => setSuppliers(d.suppliers || []));
    fetch('/api/warehouses').then(r => r.json()).then(d => setWarehouses(d.warehouses || []));
  }, []);

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { product: '', quantity: 1, unitCost: 0, taxRate: 0 }] }));
  const updateItem = (i, key, val) => setForm(f => ({ ...f, items: f.items.map((item, idx) => idx === i ? { ...item, [key]: val } : item) }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

  const handleProductSelect = (i, productId) => {
    const p = products.find(p => p._id === productId);
    if (p) updateItem(i, 'product', productId);
    updateItem(i, 'unitCost', p?.costPrice || 0);
  };

  const subTotal = form.items.reduce((s, i) => s + (i.quantity * i.unitCost), 0);

  const handleSave = async () => {
    if (!form.supplier) return toast.error('اختر المورد');
    if (form.items.length === 0 || form.items.some(i => !i.product)) return toast.error('أضف المنتجات');
    const res = await fetch('/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, paidAmount: form.paymentMethod === 'CREDIT' ? 0 : subTotal }),
    });
    const data = await res.json();
    if (res.ok) { toast.success('✅ تمت إضافة فاتورة الشراء'); setModal(false); setForm({ paymentMethod: 'CASH', status: 'PAID', items: [] }); load(); }
    else toast.error(data.error);
  };

  const fmt = (n) => new Intl.NumberFormat('ar-SD').format(Math.round(n || 0));
  const totalRevenue = purchases.reduce((s, i) => s + (i.totalAmount || 0), 0);
  const statusMap = { PAID: { label: 'مدفوع', cls: 'badge-green' }, PARTIAL: { label: 'جزئي', cls: 'badge-yellow' }, CREDIT: { label: 'آجل', cls: 'badge-red' }, CANCELLED: { label: 'ملغي', cls: 'badge-red' } };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏭 المشتريات</h1>
          <p className="text-sm text-gray-500 mt-1">{purchases.length} فاتورة</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary">+ فاتورة شراء جديدة</button>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex items-center gap-2"><label className="text-sm text-gray-600">من:</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input-field w-40" /></div>
        <div className="flex items-center gap-2"><label className="text-sm text-gray-600">إلى:</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="input-field w-40" /></div>
        {(from || to) && <button onClick={() => { setFrom(''); setTo(''); }} className="btn-secondary text-sm">مسح</button>}
        <div className="mr-auto bg-orange-50 border border-orange-200 rounded-lg px-4 py-2 text-sm">
          <span className="text-gray-600">إجمالي المشتريات: </span>
          <span className="font-bold text-orange-700">{fmt(totalRevenue)} SDG</span>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{['رقم الفاتورة','المورد','الإجمالي','المدفوع','الطريقة','الحالة','التاريخ'].map((h,i) => (
                <th key={i} className="text-right py-3 px-4 font-medium text-gray-600">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y">
              {loading ? <tr><td colSpan="7" className="text-center py-12 text-gray-400">جاري التحميل...</td></tr>
              : purchases.length === 0 ? <tr><td colSpan="7" className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-2">🏭</div>لا توجد مشتريات</td></tr>
              : purchases.map(p => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-blue-600 text-xs">{p.invoiceNumber}</td>
                  <td className="py-3 px-4 font-medium">{p.supplierName || p.supplier?.supplierName}</td>
                  <td className="py-3 px-4 font-bold">{fmt(p.totalAmount)} SDG</td>
                  <td className="py-3 px-4 text-gray-600">{fmt(p.paidAmount)} SDG</td>
                  <td className="py-3 px-4 text-gray-600">{p.paymentMethod === 'CASH' ? 'نقدي' : p.paymentMethod === 'CREDIT' ? 'آجل' : 'تحويل'}</td>
                  <td className="py-3 px-4"><span className={(statusMap[p.status] || statusMap.PAID).cls}>{(statusMap[p.status] || statusMap.PAID).label}</span></td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{new Date(p.invoiceDate).toLocaleDateString('ar-SD')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Purchase Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold">🏭 فاتورة شراء جديدة</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المورد *</label>
                  <select value={form.supplier || ''} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} className="input-field">
                    <option value="">-- اختر المورد --</option>
                    {suppliers.map(s => <option key={s._id} value={s._id}>{s.supplierName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المخزن</label>
                  <select value={form.warehouse || ''} onChange={e => setForm(f => ({ ...f, warehouse: e.target.value }))} className="input-field">
                    <option value="">-- اختر المخزن --</option>
                    {warehouses.map(w => <option key={w._id} value={w._id}>{w.warehouseName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">رقم فاتورة المورد</label>
                  <input type="text" value={form.supplierInvoice || ''} onChange={e => setForm(f => ({ ...f, supplierInvoice: e.target.value }))} className="input-field" placeholder="اختياري" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">طريقة الدفع</label>
                  <select value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))} className="input-field">
                    <option value="CASH">💵 نقدي</option>
                    <option value="TRANSFER">🏦 تحويل بنكي</option>
                    <option value="CREDIT">📝 آجل</option>
                  </select>
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">الأصناف</h3>
                  <button onClick={addItem} className="btn-secondary text-sm">+ إضافة صنف</button>
                </div>
                {form.items.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed">
                    اضغط "+ إضافة صنف" لإضافة المنتجات
                  </div>
                ) : (
                  <div className="space-y-2">
                    {form.items.map((item, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-xl p-3">
                        <div className="col-span-5">
                          <select value={item.product} onChange={e => handleProductSelect(i, e.target.value)} className="input-field text-sm">
                            <option value="">-- اختر المنتج --</option>
                            {products.map(p => <option key={p._id} value={p._id}>{p.productNameAr || p.productName} ({p.productCode})</option>)}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <input type="number" min="0.01" step="0.01" placeholder="الكمية" value={item.quantity}
                            onChange={e => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)} className="input-field text-sm text-center" />
                        </div>
                        <div className="col-span-3">
                          <input type="number" min="0" step="0.01" placeholder="سعر الوحدة" value={item.unitCost}
                            onChange={e => updateItem(i, 'unitCost', parseFloat(e.target.value) || 0)} className="input-field text-sm text-center" />
                        </div>
                        <div className="col-span-1 text-center text-sm font-bold text-blue-600">
                          {fmt(item.quantity * item.unitCost)}
                        </div>
                        <div className="col-span-1 text-center">
                          <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-lg">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary */}
              {form.items.length > 0 && (
                <div className="flex justify-end">
                  <div className="bg-blue-50 rounded-xl p-4 w-64 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">الإجمالي:</span>
                      <span className="font-bold text-blue-700 text-lg">{fmt(subTotal)} SDG</span></div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                <textarea rows={2} value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input-field" />
              </div>
            </div>
            <div className="p-6 border-t flex gap-3 justify-end sticky bottom-0 bg-white">
              <button onClick={() => setModal(false)} className="btn-secondary">إلغاء</button>
              <button onClick={handleSave} className="btn-primary">💾 حفظ الفاتورة</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
