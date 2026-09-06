const Invoice = require("../models/Invoice");
const generateInvoiceNumber = require("../utils/generateInvoiceNumber");
const { generateInvoicePDF } = require("../services/pdfService");
const { sendInvoiceEmail } = require("../services/emailService");

/**
 * Get all invoices
 */
const getInvoices = async (req, res) => {
  try {
    const {
      status,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {
      user: req.user._id,
    };

    if (status && status !== "All") {
      filter.status = status;
    }

    // Optional invoice search
    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: "i" } },
      ];
    }

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.max(Number(limit), 1);

    const invoices = await Invoice.find(filter)
      .populate("client", "name email company")
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    const total = await Invoice.countDocuments(filter);

    res.json({
      success: true,
      total,
      pages: Math.ceil(total / limitNumber),
      data: invoices,
    });
  } catch (error) {
    console.error("GET INVOICES ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get single invoice
 */
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
      .populate("client")
      .populate(
        "user",
        "name businessName businessEmail businessPhone businessAddress"
      );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error("GET INVOICE ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Create invoice
 */
const createInvoice = async (req, res) => {
  try {
    const {
      client,
      items,
      taxRate = 18,
      discount = 0,
      dueDate,
      notes,
    } = req.body;

    if (!client) {
      return res.status(400).json({
        success: false,
        message: "Client is required",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one invoice item is required",
      });
    }

    const subtotal = items.reduce(
      (sum, item) =>
        sum + Number(item.quantity || 0) * Number(item.rate || 0),
      0
    );

    const taxAmount = (subtotal * Number(taxRate)) / 100;

    const total =
      subtotal +
      taxAmount -
      Number(discount || 0);

    const invoiceNumber = await generateInvoiceNumber();

    const itemsWithAmount = items.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      rate: Number(item.rate),
      amount:
        Number(item.quantity || 0) *
        Number(item.rate || 0),
    }));

    const invoice = await Invoice.create({
      user: req.user._id,
      client,
      invoiceNumber,
      items: itemsWithAmount,
      subtotal,
      taxRate: Number(taxRate),
      taxAmount,
      discount: Number(discount || 0),
      total,
      dueDate,
      notes,
    });

    res.status(201).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error("CREATE INVOICE ERROR:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update invoice
 */
const updateInvoice = async (req, res) => {
  try {
    const {
      items,
      taxRate = 18,
      discount = 0,
    } = req.body;

    if (items) {
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invoice must contain at least one item",
        });
      }

      const subtotal = items.reduce(
        (sum, item) =>
          sum +
          Number(item.quantity || 0) *
            Number(item.rate || 0),
        0
      );

      const taxAmount =
        (subtotal * Number(taxRate)) / 100;

      const total =
        subtotal +
        taxAmount -
        Number(discount || 0);

      req.body.subtotal = subtotal;
      req.body.taxRate = Number(taxRate);
      req.body.taxAmount = taxAmount;
      req.body.discount = Number(discount || 0);
      req.body.total = total;

      req.body.items = items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        rate: Number(item.rate),
        amount:
          Number(item.quantity || 0) *
          Number(item.rate || 0),
      }));
    }

    const invoice = await Invoice.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).populate("client");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error("UPDATE INVOICE ERROR:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete invoice
 */
const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    res.json({
      success: true,
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    console.error("DELETE INVOICE ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Download invoice PDF
 */
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
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    console.log("GENERATING PDF...");

    const pdfBuffer = await generateInvoicePDF(invoice);

    console.log(
      "PDF GENERATED:",
      Buffer.isBuffer(pdfBuffer),
      pdfBuffer?.length
    );

    if (!Buffer.isBuffer(pdfBuffer)) {
      throw new Error(
        "PDF generation failed: generateInvoicePDF did not return a Buffer"
      );
    }

    const filename = `${invoice.invoiceNumber}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    return res.end(pdfBuffer);
  } catch (error) {
    console.error("========== PDF ERROR ==========");
    console.error(error);
    console.error("MESSAGE:", error.message);
    console.error("STACK:", error.stack);
    console.error("================================");

    if (res.headersSent) {
      return res.end();
    }

    return res.status(500).json({
      success: false,
      message: "Failed to generate invoice PDF",
      error: error.message,
    });
  }
};

/**
 * Send invoice by email
 */
const sendInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
      .populate("client")
      .populate(
        "user",
        "name businessName businessEmail businessPhone"
      );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    if (!invoice.client?.email) {
      return res.status(400).json({
        success: false,
        message: "Client email is missing",
      });
    }

    const pdfBuffer = await generateInvoicePDF(invoice);

    if (!Buffer.isBuffer(pdfBuffer)) {
      throw new Error(
        "PDF generation failed: generateInvoicePDF did not return a Buffer"
      );
    }

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

    res.json({
      success: true,
      message: "Invoice sent successfully",
    });
  } catch (error) {
    console.error("SEND INVOICE ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Dashboard statistics
 */
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const total = await Invoice.countDocuments({
      user: userId,
    });

    const paid = await Invoice.countDocuments({
      user: userId,
      status: "Paid",
    });

    const pending = await Invoice.countDocuments({
      user: userId,
      status: "Sent",
    });

    const overdue = await Invoice.countDocuments({
      user: userId,
      status: "Overdue",
    });

    const revenue = await Invoice.aggregate([
      {
        $match: {
          user: userId,
          status: "Paid",
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$total",
          },
        },
      },
    ]);

    const pendingAmount = await Invoice.aggregate([
      {
        $match: {
          user: userId,
          status: {
            $in: ["Sent", "Overdue"],
          },
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$total",
          },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        totalInvoices: total,
        paidInvoices: paid,
        pendingInvoices: pending,
        overdueInvoices: overdue,
        totalRevenue: revenue[0]?.total || 0,
        pendingAmount: pendingAmount[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error("DASHBOARD ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
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

