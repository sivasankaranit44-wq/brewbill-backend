const puppeteer = require("puppeteer");

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
      return res.status(404).json({ message: "Invoice not found" });
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

const generateInvoicePDF = async (invoice) => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
    ],
  });

  const page = await browser.newPage();

  const itemsHTML = invoice.items.map(item => `
    ...
  `).join("");

  const html = `
    <!DOCTYPE html>
    <html>
      ...
    </html>
  `;

  await page.setContent(html, {
    waitUntil: "networkidle0",
  });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
  });

  await browser.close();

  return pdfBuffer;
};

module.exports = { generateInvoicePDF };