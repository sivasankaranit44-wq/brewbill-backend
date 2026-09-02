const dns = require("dns");

dns.setServers(["1.1.1.1", "1.0.0.1"])

const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");

const authRoutes = require("./routes/authRoutes");
const clientRoutes = require("./routes/clientRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");

const app = express();

connectDB();

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Brew Invoice API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/invoices", invoiceRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));