const Invoice = require("../models/Invoice");
const Client = require("../models/Client");
const generateInvoiceNumber = require("../utils/generateInvoiceNumber");
const { generateInvoicePDF } = require("../services/pdfService");
const { sendInvoiceEmail } = require("../services/emailService");

const getInvoices = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const filter = { user: req.user._id };
    if (status && status !== "All") filter.status = status;

    const invoices = await Invoice.find(filter)
      .populate("client", "name email company")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Invoice.countDocuments(filter);
    res.json({ success: true, total, pages: Math.ceil(total / limit), data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id })
      .populate("client")
      .populate("user", "name businessName businessEmail businessPhone businessAddress");
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createInvoice = async (req, res) => {
  try {
    const { client, items, taxRate = 18, discount = 0, dueDate, notes } = req.body;

    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount - discount;
    const invoiceNumber = await generateInvoiceNumber();

    const itemsWithAmount = items.map(item => ({
      ...item,
      amount: item.quantity * item.rate,
    }));

    const invoice = await Invoice.create({
      user: req.user._id,
      client,
      invoiceNumber,
      items: itemsWithAmount,
      subtotal,
      taxRate,
      taxAmount,
      discount,
      total,
      dueDate,
      notes,
    });

    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateInvoice = async (req, res) => {
  try {
    const { items, taxRate = 18, discount = 0 } = req.body;
    if (items) {
      req.body.subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
      req.body.taxAmount = (req.body.subtotal * taxRate) / 100;
      req.body.total = req.body.subtotal + req.body.taxAmount - discount;
      req.body.items = items.map(item => ({ ...item, amount: item.quantity * item.rate }));
    }

    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate("client");

    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const downloadInvoicePDF = async (req, res) => {
  try {
    console.log("PDF REQUEST STARTED:", req.params.id);

    const invoice = await Invoice.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
      .populate("client")
      .populate(
        "user",
        "name businessName businessEmail businessPhone businessAddress"
      );

    console.log("INVOICE FOUND:", !!invoice);

    if (!invoice) {
      console.log("INVOICE NOT FOUND");
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    console.log("GENERATING PDF...");

    const pdfBuffer = await generateInvoicePDF(invoice);

    console.log("PDF GENERATED:", pdfBuffer.length);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
    });

    res.send(pdfBuffer);

    console.log("PDF SENT SUCCESSFULLY");
  } catch (error) {
    console.error("========== PDF ERROR ==========");
    console.error(error);
    console.error("MESSAGE:", error.message);
    console.error("STACK:", error.stack);
    console.error("================================");

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const sendInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id })
      .populate("client")
      .populate("user", "name businessName businessEmail businessPhone");
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    const pdfBuffer = await generateInvoicePDF(invoice);

    await sendInvoiceEmail({
      to: invoice.client.email,
      clientName: invoice.client.name,
      invoiceNumber: invoice.invoiceNumber,
      dueDate: invoice.dueDate,
      total: invoice.total,
      pdfBuffer,
    });

    invoice.status = "Sent";
    await invoice.save();

    res.json({ success: true, message: "Invoice sent successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const total = await Invoice.countDocuments({ user: userId });
    const paid = await Invoice.countDocuments({ user: userId, status: "Paid" });
    const pending = await Invoice.countDocuments({ user: userId, status: "Sent" });
    const overdue = await Invoice.countDocuments({ user: userId, status: "Overdue" });

    const revenue = await Invoice.aggregate([
      { $match: { user: userId, status: "Paid" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);

    const pending_amount = await Invoice.aggregate([
      { $match: { user: userId, status: { $in: ["Sent", "Overdue"] } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);

    res.json({
      success: true,
      data: {
        totalInvoices: total,
        paidInvoices: paid,
        pendingInvoices: pending,
        overdueInvoices: overdue,
        totalRevenue: revenue[0]?.total || 0,
        pendingAmount: pending_amount[0]?.total || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  downloadInvoicePDF,
  sendInvoice,
  getDashboardStats,
};