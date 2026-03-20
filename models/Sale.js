import mongoose from 'mongoose';

const SaleItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productCode: { type: String },
  productName: { type: String },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  costPrice: { type: Number, default: 0 }, // for profit calc
  discount: { type: Number, default: 0 },  // amount
  taxRate: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, default: null }, // v3.1
  notes: { type: String },
});

const SaleSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true },
  invoiceType: { type: String, enum: ['RETAIL', 'WHOLESALE'], default: 'RETAIL' },
  invoiceDate: { type: Date, default: Date.now },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName: { type: String, default: 'عميل نقدي' },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [SaleItemSchema],
  subTotal: { type: Number, default: 0 },
  discountType: { type: String, enum: ['AMOUNT', 'PERCENT'], default: 'AMOUNT' },
  discountValue: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['CASH', 'CARD', 'CREDIT', 'TRANSFER'], default: 'CASH' },
  status: { type: String, enum: ['PAID', 'PARTIAL', 'CREDIT', 'CANCELLED'], default: 'PAID' },
  notes: { type: String },
  qrCode: { type: String },
}, { timestamps: true });

SaleSchema.index({ invoiceDate: -1 });
SaleSchema.index({ customer: 1 });

// Auto invoice number
SaleSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const d = new Date();
    const ym = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}`;
    const count = await this.constructor.countDocuments();
    this.invoiceNumber = `INV-${ym}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

export default mongoose.models.Sale || mongoose.model('Sale', SaleSchema);
