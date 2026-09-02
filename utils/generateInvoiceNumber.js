const Invoice = require("../models/Invoice");

const generateInvoiceNumber = async () => {
  const count = await Invoice.countDocuments();
  const number = String(count + 1).padStart(4, "0");
  return `INV-${number}`;
};

module.exports = generateInvoiceNumber;