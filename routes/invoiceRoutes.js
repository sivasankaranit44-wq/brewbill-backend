const express = require("express");
const router = express.Router();
const {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  downloadInvoicePDF,
  sendInvoice,
  getDashboardStats,
} = require("../controllers/invoiceController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);
router.get("/stats", getDashboardStats);
router.get("/", getInvoices);
router.get("/:id", getInvoiceById);
router.post("/", createInvoice);
router.put("/:id", updateInvoice);
router.delete("/:id", deleteInvoice);
router.get("/:id/pdf", downloadInvoicePDF);
router.post("/:id/send", sendInvoice);

module.exports = router;