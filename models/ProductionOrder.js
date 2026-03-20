import mongoose from 'mongoose';

const productionOrderSchema = new mongoose.Schema({
  recipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
  finishedProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  batchNumber: { type: String, required: true, unique: true },
  plannedQty: { type: Number, required: true },
  actualQty: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], 
    default: 'PENDING' 
  },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  startDate: { type: Date, default: Date.now },
  endDate: Date,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: String
}, { timestamps: true });

export default mongoose.models.ProductionOrder || mongoose.model('ProductionOrder', productionOrderSchema);
