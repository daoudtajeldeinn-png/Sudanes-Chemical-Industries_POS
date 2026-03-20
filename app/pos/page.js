'use client';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

export default function POSPage() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [invoiceType, setInvoiceType] = useState('RETAIL');
  const [amountPaid, setAmountPaid] = useState('');
  const [discountType, setDiscountType] = useState('AMOUNT');
  const [discountValue, setDiscountValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastInvoice, setLastInvoice] = useState(null);
  const searchRef = useRef(null);

  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(d => setProducts(d.products || []));
    fetch('/api/customers').then(r => r.json()).then(d => setCustomers(d.customers || []));
    fetch('/api/warehouses').then(r => r.json()).then(d => {
      const whs = d.warehouses || [];
      setWarehouses(whs);
      const def = whs.find(w => w.isDefault) || whs[0];
      if (def) setSelectedWarehouse(def);
    });
    searchRef.current?.focus();
  }, []);

  const filtered = products.filter(p =>
    (p.productNameAr?.includes(search) ||
     p.productName?.toLowerCase().includes(search.toLowerCase()) ||
     p.productCode?.toLowerCase().includes(search.toLowerCase()) ||
     p.barcode?.includes(search)) &&
    p.isActive && p.productType === 'FINISHED_GOOD'
  );

  const addToCart = (product) => {
    const price = invoiceType === 'WHOLESALE' ? product.wholesalePrice : product.retailPrice;
    setCart(prev => {
      const existing = prev.find(i => i._id === product._id);
      if (existing) return prev.map(i => i._id === product._id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1, price }];
    });
    setSearch('');
    searchRef.current?.focus();
  };

  const updateQty = (id, qty) => {
    const q = parseFloat(qty);
    if (!q || q <= 0) return removeItem(id);
    setCart(prev => prev.map(i => i._id === id ? { ...i, qty: q } : i));
  };

  const updatePrice = (id, price) => {
    setCart(prev => prev.map(i => i._id === id ? { ...i, price: parseFloat(price) || 0 } : i));
  };

  const removeItem = (id) => setCart(prev => prev.filter(i => i._id !== id));
  const clearCart = () => { if (confirm('مسح السلة؟')) setCart([]); };

  const subTotal = cart.reduce((s, i) => s + i.qty * i.price, 0);
  const discountAmount = discountType === 'PERCENT'
    ? subTotal * (discountValue / 100)
    : Math.min(parseFloat(discountValue) || 0, subTotal);
  const totalAmount = subTotal - discountAmount;
  const change = Math.max(0, (parseFloat(amountPaid) || 0) - totalAmount);

  const fmt = (n) => new Intl.NumberFormat('ar-SD').format(Math.round(n || 0));

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error('السلة فارغة!');
    if (paymentMethod === 'CASH') {
      const paid = parseFloat(amountPaid) || 0;
      if (paid < totalAmount) return toast.error('المبلغ المدفوع أقل من الإجمالي');
    }
    setLoading(true);
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceType,
          customer: selectedCustomer?._id,
          customerName: selectedCustomer?.customerName || 'عميل نقدي',
          warehouse: selectedWarehouse?._id,
          items: cart.map(i => ({
            product: i._id,
            productCode: i.productCode,
            productName: i.productNameAr || i.productName,
            quantity: i.qty,
            unitPrice: i.price,
            discount: 0,
            taxRate: i.taxRate || 0,
            totalPrice: i.qty * i.price,
          })),
          discountType,
          discountValue: parseFloat(discountValue) || 0,
          discountAmount,
          paymentMethod,
          paidAmount: paymentMethod === 'CREDIT' ? 0 : (parseFloat(amountPaid) || totalAmount),
          status: paymentMethod === 'CREDIT' ? 'CREDIT' : 'PAID',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('✅ تم البيع بنجاح!');
        setLastInvoice(data.sale);
        setCart([]);
        setSelectedCustomer(null);
        setCustomerSearch('');
        setAmountPaid('');
        setDiscountValue(0);
      } else {
        toast.error(data.error || 'حدث خطأ');
      }
    } catch { toast.error('خطأ في الاتصال'); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100" dir="rtl">
      {/* === Left: Products Grid === */}
      <div className="flex-1 flex flex-col bg-white border-l border-gray-200">
        {/* Top bar */}
        <div className="p-4 border-b bg-gray-50 space-y-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900 whitespace-nowrap">🛒 نقطة البيع</h1>
            <div className="flex gap-2 mr-auto">
              <button onClick={() => setInvoiceType('RETAIL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${invoiceType === 'RETAIL' ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                تجزئة
              </button>
              <button onClick={() => setInvoiceType('WHOLESALE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${invoiceType === 'WHOLESALE' ? 'bg-purple-600 text-white border-purple-600' : 'text-gray-600 border-gray-200 hover:border-purple-300'}`}>
                جملة
              </button>
            </div>
          </div>
          <input ref={searchRef} type="text" placeholder="🔍 ابحث بالاسم أو الكود أو الباركود..."
            className="input-field text-base" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filtered.map(p => {
              const price = invoiceType === 'WHOLESALE' ? p.wholesalePrice : p.retailPrice;
              const stock = p.stock || 0;
              const isOut = stock <= 0;
              const isLow = !isOut && stock <= p.minStock;
              return (
                <button key={p._id} onClick={() => !isOut && addToCart(p)} disabled={isOut}
                  className={`text-right p-3 rounded-xl border-2 transition-all text-sm ${
                    isOut ? 'opacity-40 cursor-not-allowed border-gray-100 bg-gray-50'
                    : isLow ? 'border-yellow-300 bg-yellow-50 hover:border-yellow-500 hover:shadow-md'
                    : 'border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50 hover:shadow-md'
                  }`}>
                  <div className="font-semibold text-gray-900 truncate leading-tight">{p.productNameAr || p.productName}</div>
                  <div className="text-xs text-gray-400 mt-0.5 font-mono">{p.productCode}</div>
                  <div className="text-blue-600 font-bold mt-2">{fmt(price)} <span className="text-xs font-normal">SDG</span></div>
                  <div className={`text-xs mt-1 ${isOut ? 'text-red-500' : isLow ? 'text-yellow-600' : 'text-green-600'}`}>
                    {isOut ? '⛔ نفد' : `${stock} ${p.unit?.unitCode || ''}`}
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-5 text-center text-gray-400 py-20">
                <div className="text-4xl mb-3">📦</div>
                <div>{search ? `لا نتائج لـ "${search}"` : 'لا توجد منتجات — أضف بيانات تجريبية من الإعدادات'}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* === Right: Cart Panel === */}
      <div className="w-96 bg-white flex flex-col border-r border-gray-200 shadow-xl">
        {/* Customer & Warehouse */}
        <div className="p-4 border-b space-y-3 bg-gray-50">
          {/* Customer search */}
          <div className="relative">
            <input type="text" placeholder="🔍 ابحث عن عميل (اختياري)"
              className="input-field text-sm" value={customerSearch}
              onChange={e => setCustomerSearch(e.target.value)} />
            {customerSearch && !selectedCustomer && (
              <div className="absolute top-full right-0 left-0 bg-white border rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto mt-1">
                {customers.filter(c =>
                  c.customerName?.includes(customerSearch) || c.phone?.includes(customerSearch) || c.customerCode?.includes(customerSearch)
                ).slice(0, 6).map(c => (
                  <button key={c._id}
                    onClick={() => { setSelectedCustomer(c); setCustomerSearch(c.customerName); }}
                    className="w-full text-right px-4 py-2.5 hover:bg-blue-50 text-sm border-b last:border-0">
                    <div className="font-medium text-gray-900">{c.customerName}</div>
                    <div className="text-gray-400 text-xs">{c.customerCode} • {c.phone}</div>
                  </button>
                ))}
                {customers.filter(c => c.customerName?.includes(customerSearch)).length === 0 && (
                  <div className="px-4 py-3 text-gray-400 text-sm text-center">لا توجد نتائج</div>
                )}
              </div>
            )}
          </div>
          {selectedCustomer && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <div>
                <div className="text-sm font-medium text-blue-900">{selectedCustomer.customerName}</div>
                <div className="text-xs text-blue-600">{selectedCustomer.group?.groupName || ''} • {selectedCustomer.customerCode}</div>
              </div>
              <button onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }} className="text-blue-400 hover:text-red-500 text-lg">✕</button>
            </div>
          )}
          {/* Warehouse */}
          {warehouses.length > 1 && (
            <select className="input-field text-sm" value={selectedWarehouse?._id || ''}
              onChange={e => setSelectedWarehouse(warehouses.find(w => w._id === e.target.value))}>
              {warehouses.map(w => <option key={w._id} value={w._id}>{w.warehouseName}</option>)}
            </select>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-3">
              <div className="text-7xl">🛒</div>
              <p className="text-gray-400">انقر على منتج لإضافته</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {cart.map(item => (
                <div key={item._id} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 truncate">{item.productNameAr || item.productName}</div>
                      <div className="text-xs text-gray-400 font-mono">{item.productCode}</div>
                    </div>
                    <button onClick={() => removeItem(item._id)} className="text-gray-300 hover:text-red-500 text-lg mr-2 flex-shrink-0 leading-none">✕</button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item._id, item.qty - 1)} className="w-7 h-7 rounded-lg bg-gray-200 hover:bg-gray-300 font-bold text-gray-700">-</button>
                    <input type="number" value={item.qty} onChange={e => updateQty(item._id, e.target.value)}
                      className="w-14 text-center border border-gray-200 rounded-lg px-1 py-1 text-sm" />
                    <button onClick={() => updateQty(item._id, item.qty + 1)} className="w-7 h-7 rounded-lg bg-gray-200 hover:bg-gray-300 font-bold text-gray-700">+</button>
                    <span className="text-gray-300 text-xs">×</span>
                    <input type="number" value={item.price} onChange={e => updatePrice(item._id, e.target.value)}
                      className="w-24 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center" />
                    <div className="mr-auto text-right">
                      <div className="font-bold text-blue-600 text-sm">{fmt(item.qty * item.price)}</div>
                      <div className="text-xs text-gray-400">SDG</div>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={clearCart} className="w-full text-center text-red-400 hover:text-red-600 text-xs py-1">🗑️ مسح السلة</button>
            </div>
          )}
        </div>

        {/* Payment Panel */}
        <div className="p-4 bg-white border-t space-y-3 shadow-inner">
          {/* Totals */}
          <div className="space-y-1.5 text-sm bg-gray-50 rounded-xl p-3">
            <div className="flex justify-between text-gray-600">
              <span>المجموع ({cart.length} صنف)</span>
              <span className="font-medium">{fmt(subTotal)} SDG</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-xs">خصم:</span>
              <select value={discountType} onChange={e => setDiscountType(e.target.value)} className="border rounded px-1 py-0.5 text-xs">
                <option value="AMOUNT">مبلغ</option>
                <option value="PERCENT">%</option>
              </select>
              <input type="number" min="0" value={discountValue} onChange={e => setDiscountValue(e.target.value)}
                className="w-20 border rounded-lg px-2 py-0.5 text-xs text-center" />
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-red-500 text-xs">
                <span>قيمة الخصم</span><span>- {fmt(discountAmount)} SDG</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2 mt-1">
              <span>الإجمالي</span>
              <span className="text-blue-700">{fmt(totalAmount)} SDG</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="grid grid-cols-4 gap-1">
            {[
              { val: 'CASH', icon: '💵', label: 'نقدي' },
              { val: 'CARD', icon: '💳', label: 'بطاقة' },
              { val: 'TRANSFER', icon: '🏦', label: 'تحويل' },
              { val: 'CREDIT', icon: '📝', label: 'آجل' },
            ].map(m => (
              <button key={m.val} onClick={() => setPaymentMethod(m.val)}
                className={`py-2 rounded-xl text-xs font-medium border-2 transition-all ${paymentMethod === m.val ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                <div>{m.icon}</div>
                <div>{m.label}</div>
              </button>
            ))}
          </div>

          {/* Cash input */}
          {paymentMethod === 'CASH' && (
            <div>
              <label className="block text-xs text-gray-600 mb-1">المبلغ المدفوع</label>
              <input type="number" placeholder={`${fmt(totalAmount)} SDG`} value={amountPaid}
                onChange={e => setAmountPaid(e.target.value)}
                className="input-field text-lg font-bold text-center" />
              {change > 0 && (
                <div className="mt-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2 flex justify-between text-green-700 font-bold">
                  <span>الباقي:</span><span>{fmt(change)} SDG</span>
                </div>
              )}
            </div>
          )}

          {/* Checkout Button */}
          <button onClick={handleCheckout} disabled={loading || cart.length === 0}
            className="w-full py-4 rounded-xl text-lg font-bold text-white transition-all
              bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700
              disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
            {loading ? '⏳ جاري الحفظ...' : '✅ إتمام البيع'}
          </button>

          {/* Last Invoice */}
          {lastInvoice && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3 text-center">
              <div className="text-green-700 font-bold text-sm">✅ تم البيع بنجاح!</div>
              <div className="text-green-600 font-mono text-xs mt-0.5">{lastInvoice.invoiceNumber}</div>
              <div className="text-green-700 font-bold">{fmt(lastInvoice.totalAmount)} SDG</div>
              <button onClick={() => window.open(`/sales/${lastInvoice._id}`, '_blank')}
                className="text-xs text-blue-600 underline mt-1">🖨️ فتح وطباعة الفاتورة</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
