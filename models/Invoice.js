const mongoose = require("mongoose")

const itemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  rate: { type: Number, required: true },
  amount: { type: Number, required: true },
})

const invoiceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  client: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Client" },
  invoiceNumber: { type: String, required: true },
  invoiceDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  items: [itemSchema],
  subtotal: { type: Number, required: true },
  taxRate: { type: Number, default: 18 },
  taxAmount: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: {
    type: String,
    enum: ["Draft", "Sent", "Paid", "Overdue", "Cancelled"],
    default: "Draft",
  },
  notes: { type: String, default: "" },
  pdfUrl: { type: String, default: "" },
}, { timestamps: true })

module.exports = mongoose.model("Invoice", invoiceSchema)