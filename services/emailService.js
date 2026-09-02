const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendInvoiceEmail = async ({ to, clientName, invoiceNumber, dueDate, total, pdfBuffer }) => {
  const mailOptions = {
    from: `"Brew Invoice" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Invoice ${invoiceNumber} from Brew Invoice`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Invoice ${invoiceNumber}</h2>
        <p>Dear ${clientName},</p>
        <p>Please find your invoice attached.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Invoice Number</strong></td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Due Date</strong></td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${new Date(dueDate).toLocaleDateString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Total Amount</strong></td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Rs ${total.toLocaleString()}</strong></td>
          </tr>
        </table>
        <p>Please make the payment before the due date.</p>
        <p>Thank you for your business!</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb;" />
        <p style="color: #6b7280; font-size: 12px;">Sent via Brew Invoice</p>
      </div>
    `,
    attachments: pdfBuffer ? [
      {
        filename: `${invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      }
    ] : [],
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendInvoiceEmail };