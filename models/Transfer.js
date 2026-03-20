import mongoose from 'mongoose';

const transferSchema = new mongoose.Schema({
  fromWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  toWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' }
  }],
  status: { 
    type: String, 
    enum: ['PENDING', 'SENT', 'RECEIVED', 'CANCELLED'], 
    default: 'PENDING' 
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: String,
  sentAt: Date,
  receivedAt: Date
}, { timestamps: true });

export default mongoose.models.Transfer || mongoose.model('Transfer', transferSchema);
