const mongoose = require("mongoose")

const itemSchema= new mongoose.Schema({
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    rate: { type: Number, required: true },
    amount: { type: Number, required: true },
})

const invoiceSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    client: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Client" },
    invoiceNumber: { type: String, required: true },
    invoiceDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    item:[itemSchema],
    subtotal: { type: Number, required: true },
    taxRate: { type: Number, required: true },
    taxAmount: { type: Number, required: true },
    discount: { type: Number, required: true },
    total: { type: Number, required: true },
    status: { type: String, 
        enum: ["Draft", "Sent", "Paid", "Overdue", "Cancelled"], 
        default: "Draft" },
            notes: {type:String, default:""},
    pdfUrl: {type:String, default:""},
},{ timestamps: true}
)
module.exports= mongoose.model("Invoice", invoiceSchema)