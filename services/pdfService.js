const puppeteer = require("puppeteer");

/**
 * Escape HTML to prevent invoice data from breaking the generated HTML.
 */
const escapeHTML = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * Format currency for Indian Rupees.
 */
const formatCurrency = (value) => {
  const number = Number(value || 0);

  return number.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
};

/**
 * Format date for India.
 */
const formatDate = (date) => {
  if (!date) {
    return "";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toLocaleDateString("en-IN");
};

/**
 * Generate invoice PDF.
 */
const generateInvoicePDF = async (invoice) => {
  let browser = null;

  try {
    console.log("=================================");
    console.log("PDF SERVICE STARTED");
    console.log("Invoice ID:", invoice?._id);
    console.log("Invoice Number:", invoice?.invoiceNumber);
    console.log("=================================");

    /**
     * Validate invoice
     */
    if (!invoice) {
      throw new Error("Invoice data is missing");
    }

    if (!invoice.invoiceNumber) {
      throw new Error("Invoice number is missing");
    }

    console.log("Invoice validation passed");

    /**
     * Launch Puppeteer
     *
     * These arguments are important for Render/Linux environments.
     */
    console.log("Launching Puppeteer...");

    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
      ],
    });

    console.log("Puppeteer launched successfully");

    /**
     * Create new page
     */
    const page = await browser.newPage();

    console.log("New Puppeteer page created");

    /**
     * Set page size
     */
    await page.setViewport({
      width: 1200,
      height: 1600,
      deviceScaleFactor: 1,
    });

    console.log("Viewport configured");

    /**
     * Prepare invoice items
     */
    const items = Array.isArray(invoice.items)
      ? invoice.items
      : [];

    console.log("Invoice items:", items.length);

    const itemsHTML = items
      .map((item) => {
        const description = escapeHTML(
          item.description || ""
        );

        const quantity = Number(item.quantity || 0);

        const rate = Number(item.rate || 0);

        const amount = Number(item.amount || 0);

        return `
          <tr>
            <td class="item-description">
              ${description}
            </td>

            <td class="item-qty">
              ${quantity}
            </td>

            <td class="item-number">
              Rs ${formatCurrency(rate)}
            </td>

            <td class="item-number">
              Rs ${formatCurrency(amount)}
            </td>
          </tr>
        `;
      })
      .join("");

    /**
     * Prepare business information
     */
    const businessName = escapeHTML(
      invoice.user?.businessName || ""
    );

    const businessEmail = escapeHTML(
      invoice.user?.businessEmail || ""
    );

    const businessPhone = escapeHTML(
      invoice.user?.businessPhone || ""
    );

    const businessAddress = escapeHTML(
      invoice.user?.businessAddress || ""
    );

    /**
     * Prepare client information
     */
    const clientName = escapeHTML(
      invoice.client?.name || ""
    );

    const clientCompany = escapeHTML(
      invoice.client?.company || ""
    );

    const clientEmail = escapeHTML(
      invoice.client?.email || ""
    );

    const clientPhone = escapeHTML(
      invoice.client?.phone || ""
    );

    const clientAddress = escapeHTML(
      invoice.client?.address || ""
    );

    const clientGSTIN = escapeHTML(
      invoice.client?.gstin || ""
    );

    /**
     * Prepare invoice information
     */
    const invoiceNumber = escapeHTML(
      invoice.invoiceNumber
    );

    const status = escapeHTML(
      invoice.status || "Draft"
    );

    const invoiceDate = formatDate(
      invoice.invoiceDate
    );

    const dueDate = formatDate(
      invoice.dueDate
    );

    const subtotal = formatCurrency(
      invoice.subtotal
    );

    const taxRate = Number(
      invoice.taxRate || 0
    );

    const taxAmount = formatCurrency(
      invoice.taxAmount
    );

    const discount = Number(
      invoice.discount || 0
    );

    const total = formatCurrency(
      invoice.total
    );

    const notes = escapeHTML(
      invoice.notes || ""
    );

    /**
     * Build HTML
     */
    const html = `
      <!DOCTYPE html>

      <html>
        <head>

          <meta charset="UTF-8" />

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />

          <style>

            * {
              box-sizing: border-box;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
            }

            body {
              font-family: Arial, Helvetica, sans-serif;
              padding: 40px;
              color: #1f2937;
              font-size: 14px;
            }

            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 40px;
            }

            .brand {
              font-size: 28px;
              font-weight: bold;
              color: #1e40af;
            }

            .business-info {
              font-size: 13px;
              color: #6b7280;
              margin-top: 4px;
            }

            .invoice-title {
              font-size: 36px;
              font-weight: bold;
              color: #6b7280;
            }

            .invoice-number {
              font-size: 14px;
              color: #1e40af;
              font-weight: bold;
              margin-top: 4px;
            }

            .status-badge {
              display: inline-block;
              margin-top: 8px;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              background: #dcfce7;
              color: #16a34a;
            }

            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
              margin-bottom: 40px;
            }

            .label {
              font-size: 12px;
              color: #6b7280;
              text-transform: uppercase;
              margin-bottom: 5px;
            }

            .value {
              font-size: 14px;
              color: #1f2937;
              font-weight: 500;
              margin-bottom: 4px;
            }

            .secondary {
              font-size: 13px;
              color: #6b7280;
              margin-bottom: 3px;
            }

            .right {
              text-align: right;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }

            thead {
              background: #1e40af;
              color: #ffffff;
            }

            thead th {
              padding: 12px 10px;
              font-size: 13px;
              font-weight: bold;
              text-align: left;
            }

            tbody td {
              padding: 10px;
              border-bottom: 1px solid #e5e7eb;
              font-size: 13px;
            }

            .item-description {
              text-align: left;
            }

            .item-qty {
              text-align: center;
            }

            .item-number {
              text-align: right;
            }

            .totals {
              margin-left: auto;
              width: 300px;
            }

            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #e5e7eb;
              font-size: 14px;
            }

            .grand-total {
              display: flex;
              justify-content: space-between;
              padding: 12px 0;
              font-size: 18px;
              font-weight: bold;
              color: #1e40af;
              border-top: 2px solid #1e40af;
            }

            .notes {
              margin-top: 30px;
              padding: 16px;
              background: #f9fafb;
              border-radius: 8px;
              font-size: 13px;
              color: #6b7280;
            }

            .footer {
              margin-top: 60px;
              text-align: center;
              font-size: 12px;
              color: #9ca3af;
            }

          </style>

        </head>

        <body>

          <!-- HEADER -->

          <div class="header">

            <div>

              <div class="brand">
                Brew Invoice
              </div>

              ${
                businessName
                  ? `<div class="business-info">${businessName}</div>`
                  : ""
              }

              ${
                businessEmail
                  ? `<div class="business-info">${businessEmail}</div>`
                  : ""
              }

              ${
                businessPhone
                  ? `<div class="business-info">${businessPhone}</div>`
                  : ""
              }

              ${
                businessAddress
                  ? `<div class="business-info">${businessAddress}</div>`
                  : ""
              }

            </div>

            <div class="right">

              <div class="invoice-title">
                INVOICE
              </div>

              <div class="invoice-number">
                ${invoiceNumber}
              </div>

              <span class="status-badge">
                ${status}
              </span>

            </div>

          </div>


          <!-- CLIENT + DATE -->

          <div class="info-grid">

            <div>

              <div class="label">
                Bill To
              </div>

              ${
                clientName
                  ? `<div class="value">${clientName}</div>`
                  : ""
              }

              ${
                clientCompany
                  ? `<div class="secondary">${clientCompany}</div>`
                  : ""
              }

              ${
                clientEmail
                  ? `<div class="secondary">${clientEmail}</div>`
                  : ""
              }

              ${
                clientPhone
                  ? `<div class="secondary">${clientPhone}</div>`
                  : ""
              }

              ${
                clientAddress
                  ? `<div class="secondary">${clientAddress}</div>`
                  : ""
              }

              ${
                clientGSTIN
                  ? `<div class="secondary">GSTIN: ${clientGSTIN}</div>`
                  : ""
              }

            </div>


            <div class="right">

              <div class="label">
                Invoice Date
              </div>

              <div class="value">
                ${invoiceDate}
              </div>

              <div
                class="label"
                style="margin-top: 12px;"
              >
                Due Date
              </div>

              <div
                class="value"
                style="color: #dc2626;"
              >
                ${dueDate}
              </div>

            </div>

          </div>


          <!-- ITEMS -->

          <table>

            <thead>

              <tr>

                <th>
                  Description
                </th>

                <th
                  style="text-align: center;"
                >
                  Qty
                </th>

                <th
                  style="text-align: right;"
                >
                  Rate
                </th>

                <th
                  style="text-align: right;"
                >
                  Amount
                </th>

              </tr>

            </thead>

            <tbody>

              ${
                itemsHTML ||
                `
                  <tr>
                    <td
                      colspan="4"
                      style="text-align: center; padding: 20px;"
                    >
                      No items
                    </td>
                  </tr>
                `
              }

            </tbody>

          </table>


          <!-- TOTALS -->

          <div class="totals">

            <div class="total-row">

              <span>
                Subtotal
              </span>

              <span>
                Rs ${subtotal}
              </span>

            </div>


            <div class="total-row">

              <span>
                Tax (${taxRate}%)
              </span>

              <span>
                Rs ${taxAmount}
              </span>

            </div>


            ${
              discount > 0
                ? `
                  <div class="total-row">

                    <span>
                      Discount
                    </span>

                    <span>
                      - Rs ${formatCurrency(discount)}
                    </span>

                  </div>
                `
                : ""
            }


            <div class="grand-total">

              <span>
                Total
              </span>

              <span>
                Rs ${total}
              </span>

            </div>

          </div>


          <!-- NOTES -->

          ${
            notes
              ? `
                <div class="notes">

                  <strong>
                    Notes:
                  </strong>

                  ${notes}

                </div>
              `
              : ""
          }


          <!-- FOOTER -->

          <div class="footer">
            Thank you for your business! Brew Invoice
          </div>

        </body>
      </html>
    `;

    console.log("HTML generated");
    console.log("HTML length:", html.length);

    /**
     * Load HTML into Chromium.
     */
    console.log("Setting page content...");

    await page.setContent(html, {
      waitUntil: "load",
      timeout: 30000,
    });

    console.log("Page content loaded");

    /**
     * Small wait to make sure Chromium has finished rendering.
     */
    await new Promise((resolve) => {
      setTimeout(resolve, 500);
    });

    console.log("Page rendering completed");

    /**
     * Generate PDF.
     */
    console.log("Generating PDF...");

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
      },
    });

    console.log(
      "PDF generated successfully"
    );

    console.log(
      "PDF buffer type:",
      Buffer.isBuffer(pdfBuffer)
    );

    console.log(
      "PDF buffer size:",
      pdfBuffer?.length
    );

    /**
     * Validate PDF buffer.
     */
    if (!Buffer.isBuffer(pdfBuffer)) {
      throw new Error(
        "Generated PDF is not a valid Buffer"
      );
    }

    if (pdfBuffer.length === 0) {
      throw new Error(
        "Generated PDF buffer is empty"
      );
    }

    console.log("PDF validation passed");

    return pdfBuffer;

  } catch (error) {

    console.error(
      "================================="
    );

    console.error(
      "PDF SERVICE ERROR"
    );

    console.error(
      "Message:",
      error.message
    );

    console.error(
      "Name:",
      error.name
    );

    console.error(
      "Stack:",
      error.stack
    );

    console.error(
      "================================="
    );

    throw error;

  } finally {

    if (browser) {

      try {

        await browser.close();

        console.log(
          "Puppeteer browser closed successfully"
        );

      } catch (closeError) {

        console.error(
          "Failed to close Puppeteer browser:",
          closeError.message
        );

      }

    }

  }
};

module.exports = {
  generateInvoicePDF,
};
