import mongoose from 'mongoose';

const ExpenseCategorySchema = new mongoose.Schema({
  categoryName: { type: String, required: true },
  description: { type: String },
  isActive: { type: Boolean, default: true },
});

const ExpenseSchema = new mongoose.Schema({
  expenseDate: { type: Date, default: Date.now },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'ExpenseCategory', required: true },
  categoryName: { type: String },
  amount: { type: Number, required: true },
  description: { type: String },
  paymentMethod: { type: String, enum: ['CASH', 'CARD', 'TRANSFER'], default: 'CASH' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
}, { timestamps: true });

export const ExpenseCategory = mongoose.models.ExpenseCategory || mongoose.model('ExpenseCategory', ExpenseCategorySchema);
export default mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);
