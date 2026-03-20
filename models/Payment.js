import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  paymentDate: { type: Date, default: Date.now },
  paymentType: { type: String, enum: ['CUSTOMER', 'SUPPLIER'], required: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId }, // CustomerID or SupplierID
  referenceName: { type: String },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['CASH', 'CARD', 'TRANSFER', 'CHECK'], default: 'CASH' },
  invoice: { type: mongoose.Schema.Types.ObjectId },
  notes: { type: String },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
