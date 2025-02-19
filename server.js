const express = require("express");
const cors = require("cors");
const { getShippers, getPendingRegisterShippers, approveShipper,rejectRegisterShipper, searchApprovedShippers, searchPendingShippers, getUpdatingShippers, getCancelingShippers, approveUpdateShipper, approveCancelShipper } = require("./controllers/manageshipper");
const { loginShipper } = require("./controllers/Login");
// const { forgotPassword, resetPassword } = require("./controllers/Password");
const { getOrders, changeStatusOrder } = require("./controllers/Order");
const { updateShipper } = require("./controllers/ShipperAccount");

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
app.post("/api/login", loginShipper);
// app.post("/api/forgot-password", forgotPassword);
// app.post("/api/reset-password", resetPassword);
app.get("/api/getOrders", getOrders);
app.post("/api/changeStatusOrder", changeStatusOrder);

app.put("/api/shippers/:id", updateShipper);
// API: Lấy danh sách shipper đang chờ duyệt đăng ký
app.get("/api/pending-register-shippers", getPendingRegisterShippers);

// API: Lấy danh sách shipper đang chờ duyệt cập nhật
app.get("/api/pending-update-shippers", getUpdatingShippers);

// API: Lấy danh sách shipper đang chờ duyệt hủy tài khoản
app.get("/api/pending-cancel-shippers", getCancelingShippers);

// API: Lấy danh sách shipper đã duyệt (Active)
app.get("/api/active-shippers", getShippers);
// API: Duyệt shipper
app.post("/api/approve-shipper", approveShipper);

// API: Từ chối shipper
app.post("/api/reject-shipper", rejectRegisterShipper);


// API tìm kiếm shipper
app.get("/api/search-approved-shippers", searchApprovedShippers);
app.get("/api/search-pending-shippers", searchPendingShippers);

// Chạy server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});