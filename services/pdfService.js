const puppeteer = require("puppeteer");

const generateInvoicePDF = async (invoice) => {
  let browser;

  try {
    console.log("Launching Puppeteer...");

    browser = await puppeteer.launch({
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

    console.log("Puppeteer launched");

    const page = await browser.newPage();

    const itemsHTML = (invoice.items || [])
      .map(
        (item) => `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
              ${item.description || ""}
            </td>

            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">
              ${Number(item.quantity) || 0}
            </td>

            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">
              Rs ${Number(item.rate || 0).toLocaleString("en-IN")}
            </td>

            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">
              Rs ${Number(item.amount || 0).toLocaleString("en-IN")}
            </td>
          </tr>
        `
      )
      .join("");

    const html = `
      <!DOCTYPE html>

      <html>
        <head>
          <meta charset="UTF-8" />

          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              color: #1f2937;
            }

            .header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 40px;
            }

            .brand {
              font-size: 28px;
              font-weight: bold;
              color: #1e40af;
            }

            .invoice-title {
              font-size: 36px;
              font-weight: bold;
              color: #6b7280;
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
              margin-bottom: 4px;
            }

            .value {
              font-size: 14px;
              color: #1f2937;
              font-weight: 500;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }

            thead {
              background: #1e40af;
              color: white;
            }

            thead th {
              padding: 12px 10px;
              text-align: left;
              font-size: 13px;
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

            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              background: #dcfce7;
              color: #16a34a;
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

          <div class="header">

            <div>
              <div class="brand">
                Brew Invoice
              </div>

              <div style="font-size: 13px; color: #6b7280; margin-top: 4px;">
                ${invoice.user?.businessName || ""}
              </div>

              <div style="font-size: 13px; color: #6b7280;">
                ${invoice.user?.businessEmail || ""}
              </div>

              <div style="font-size: 13px; color: #6b7280;">
                ${invoice.user?.businessPhone || ""}
              </div>
            </div>

            <div style="text-align: right;">

              <div class="invoice-title">
                INVOICE
              </div>

              <div style="font-size: 14px; color: #1e40af; font-weight: bold;">
                ${invoice.invoiceNumber || ""}
              </div>

              <div style="margin-top: 8px;">
                <span class="status-badge">
                  ${invoice.status || "Draft"}
                </span>
              </div>

            </div>

          </div>


          <div class="info-grid">

            <div>

              <div class="label">
                Bill To
              </div>

              <div class="value">
                ${invoice.client?.name || ""}
              </div>

              <div style="font-size: 13px; color: #6b7280;">
                ${invoice.client?.company || ""}
              </div>

              <div style="font-size: 13px; color: #6b7280;">
                ${invoice.client?.email || ""}
              </div>

              <div style="font-size: 13px; color: #6b7280;">
                ${invoice.client?.phone || ""}
              </div>

              <div style="font-size: 13px; color: #6b7280;">
                ${invoice.client?.address || ""}
              </div>

              ${
                invoice.client?.gstin
                  ? `
                    <div style="font-size: 12px; color: #9ca3af;">
                      GSTIN: ${invoice.client.gstin}
                    </div>
                  `
                  : ""
              }

            </div>


            <div style="text-align: right;">

              <div class="label">
                Invoice Date
              </div>

              <div class="value">
                ${
                  invoice.invoiceDate
                    ? new Date(invoice.invoiceDate).toLocaleDateString("en-IN")
                    : ""
                }
              </div>

              <div style="margin-top: 12px;" class="label">
                Due Date
              </div>

              <div class="value" style="color: #dc2626;">
                ${
                  invoice.dueDate
                    ? new Date(invoice.dueDate).toLocaleDateString("en-IN")
                    : ""
                }
              </div>

            </div>

          </div>


          <table>

            <thead>

              <tr>
                <th>Description</th>

                <th style="text-align: center;">
                  Qty
                </th>

                <th style="text-align: right;">
                  Rate
                </th>

                <th style="text-align: right;">
                  Amount
                </th>
              </tr>

            </thead>

            <tbody>
              ${itemsHTML}
            </tbody>

          </table>


          <div class="totals">

            <div class="total-row">
              <span>Subtotal</span>
              <span>
                Rs ${Number(invoice.subtotal || 0).toLocaleString("en-IN")}
              </span>
            </div>

            <div class="total-row">
              <span>
                Tax (${Number(invoice.taxRate || 0)}%)
              </span>

              <span>
                Rs ${Number(invoice.taxAmount || 0).toLocaleString("en-IN")}
              </span>
            </div>

            ${
              Number(invoice.discount || 0) > 0
                ? `
                  <div class="total-row">
                    <span>Discount</span>
                    <span>
                      - Rs ${Number(invoice.discount).toLocaleString("en-IN")}
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
                Rs ${Number(invoice.total || 0).toLocaleString("en-IN")}
              </span>

            </div>

          </div>


          ${
            invoice.notes
              ? `
                <div class="notes">
                  <strong>Notes:</strong>
                  ${invoice.notes}
                </div>
              `
              : ""
          }


          <div class="footer">
            Thank you for your business! Brew Invoice
          </div>

        </body>
      </html>
    `;

    console.log("Setting PDF HTML...");

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    console.log("Generating PDF...");

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    console.log("PDF buffer generated:", pdfBuffer.length);

    return pdfBuffer;

  } catch (error) {
    console.error("PDF SERVICE ERROR:", error);
    console.error("PDF SERVICE MESSAGE:", error.message);
    console.error("PDF SERVICE STACK:", error.stack);

    throw error;

  } finally {
    if (browser) {
      await browser.close();
      console.log("Puppeteer browser closed");
    }
  }
};

module.exports = {
  generateInvoicePDF,
};