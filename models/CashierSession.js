import mongoose from 'mongoose';

const CashierSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  openingBalance: { type: Number, default: 0 },
  closingBalance: { type: Number },
  totalSales: { type: Number, default: 0 },
  totalReturns: { type: Number, default: 0 },
  totalExpenses: { type: Number, default: 0 },
  openedAt: { type: Date, default: Date.now },
  closedAt: { type: Date },
  status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN' },
  notes: { type: String },
});

export default mongoose.models.CashierSession || mongoose.model('CashierSession', CashierSessionSchema);
