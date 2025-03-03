const express = require("express");
const cors = require("cors");
const { getShippers, getShipperById } = require("./controllers/manageshipper");
const { loginShipper } = require("./controllers/Login");
const { forgotPassword, resetPassword } = require("./controllers/ForgotPassword");
const { getOrders, changeStatusOrder } = require("./controllers/Order");
const { updateShipper } = require("./controllers/ShipperAccount");
const {addShipper}   = require("./controllers/ShipperRegister");
const { getShipperAccount, cancelShipperAccount } = require("./controllers/ShipperAccount");
const { 
  createOrderReport, 
  createShipperReport, 
  getOrderReports, 
  getShipperReports,
  updateReportStatus,
  getCustomerOrderReports
} = require("./controllers/ReportController");

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "OPTIONS", "Delete"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.get("/api/shippers", getShippers);
app.get("/api/getShipperById", getShipperById);
app.post("/api/login", loginShipper);
// app.post("/api/forgot-password", forgotPassword);
// app.post("/api/reset-password", resetPassword);
app.get("/api/getOrders", getOrders);
app.post("/api/shippers", addShipper);
app.get("/api/shippers/:id", getShipperAccount);
app.put("/api/shippers/:id/cancel", cancelShipperAccount);
app.post("/api/reports/order", createOrderReport);
app.post("/api/reports/shipper", createShipperReport);
app.get("/api/order-reports", getOrderReports);
app.get("/api/shipper-reports", getShipperReports);
app.put("/api/reports/:reportId", updateReportStatus);
app.get("/api/customer-order-reports", getCustomerOrderReports);
// Thêm các route này
app.put("/api/orders/:id/status", changeStatusOrder);
// app.put("/api/shippers/:id", updateShipper);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});