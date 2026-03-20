import mongoose from 'mongoose';

const ReturnItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  total: { type: Number, required: true },
});

const SaleReturnSchema = new mongoose.Schema({
  returnNumber: { type: String, unique: true },
  originalSale: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale' },
  returnDate: { type: Date, default: Date.now },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName: { type: String },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [ReturnItemSchema],
  totalAmount: { type: Number, default: 0 },
  notes: { type: String },
}, { timestamps: true });

SaleReturnSchema.pre('save', async function(next) {
  if (!this.returnNumber) {
    const count = await this.constructor.countDocuments();
    this.returnNumber = `RET-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export default mongoose.models.SaleReturn || mongoose.model('SaleReturn', SaleReturnSchema);
