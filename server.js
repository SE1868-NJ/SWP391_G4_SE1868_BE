const express = require("express");
const cors = require("cors");
<<<<<<< HEAD
// const { authenticateToken } = require('./controllers/middleware/authMiddleware');
// Import controllers
// const { submitContact, getContacts } = require("./controllers/contactController");
=======
const { authenticateToken } = require('./controllers/middleware/authMiddleware');
// Import controllers
const { submitContact, getContacts } = require("./controllers/contactController");
>>>>>>> dev
const { 
    getShippers, 
    getPendingRegisterShippers,
    searchApprovedShippers,
    searchPendingShippers,
    changeShipperStatus,
    getUpdatingShippers,
    getCancelingShippers,
    searchUpdatingShippers,
    searchCancelingShippers,
    getShipperUpdateDetails
<<<<<<< HEAD
} = require("./controllers/ManageShipper");

const { loginShipper } = require("./controllers/Login");
// const { forgotPassword, resetPassword } = require("./controllers/ForgotPassword");
const {getRevenueOverview,
    getRevenueByDay,
    getRevenueByRegion,
    getRevenueByService,
    getOrders,
    getPayments,
    getFees,
    getAlerts} = require("./controllers/RevenueOp");
// const { getOrdersInProgress, changeStatusOrder, getOrderDetails } = require("./controllers/order");
=======
} = require("./controllers/manageshipper");

const { loginShipper } = require("./controllers/Login");
const { forgotPassword, resetPassword } = require("./controllers/ForgotPassword");
const { getOrdersInProgress, changeStatusOrder, getOrderDetails } = require("./controllers/order");
>>>>>>> dev
// const { updateShipper } = require("./controllers/ShipperAccount");
const { 
    getShipperDetails, 
    rejectRegisterShipper, 
    approveShipper 
} = require("./controllers/ShipperDetails");
<<<<<<< HEAD
// const { getShipperAccount } = require("./controllers/ShipperAccount");
=======
const { getShipperAccount } = require("./controllers/ShipperAccount");
>>>>>>> dev

const app = express();

// Enhanced CORS configuration
app.use(cors({
    origin: "http://localhost:3000", 
    credentials: true,
    methods: ["GET", "POST", "PUT", "OPTIONS", "DELETE"], 
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

// 📌 --- SHIPPER ROUTES ---
app.get("/api/shippers", getShippers);
// app.put("/api/shippers/:id", updateShipper);
<<<<<<< HEAD
app.get("/api/shippers/:id", getShipperDetails);
// app.get("/api/shippers-auth/:id", authenticateToken, getShipperAccount);
=======
<<<<<<< HEAD
app.get("/api/shippers/:id", getShipperDetails);
=======
app.get("/api/shippers-auth/:id", authenticateToken, getShipperAccount);
>>>>>>> 3534270428b6a222e2245efecd61cd28ebc3719a
>>>>>>> dev
app.post("/api/approve-shipper", approveShipper);
app.post("/api/reject-shipper", rejectRegisterShipper);
// API: Lấy thông tin chi tiết của shipper
app.get("/api/shippers/:id", getShipperDetails);

app.post("/api/login", loginShipper);
<<<<<<< HEAD
// app.post("/api/forgot-password", forgotPassword);
// app.post("/api/reset-password", resetPassword);

app.get("/api/pending-register-shippers", getPendingRegisterShippers);
app.get("/api/pending-update-shippers", getUpdatingShippers);
app.get("/api/pending-cancel-shippers", getCancelingShippers);
app.post("/api/approve-shipper", approveShipper);
app.post("/api/reject-shipper", rejectRegisterShipper);
app.post("/api/change-shipper-status", changeShipperStatus);

app.get("/api/search-approved-shippers", searchApprovedShippers);
app.get("/api/search-pending-shippers", searchPendingShippers);
app.get("/api/search-updating-shippers", searchUpdatingShippers);
app.get("/api/search-canceling-shippers", searchCancelingShippers);

// app.get("/api/getOrdersInProgress", getOrdersInProgress);
// app.get("/api/getOrderDetails/:id", getOrderDetails);
// app.post("/api/changeStatusOrder", changeStatusOrder);

// app.post("/api/contact/submit", submitContact);
// app.get("/api/contact/list", getContacts);
=======
app.post("/api/forgot-password", forgotPassword);
app.post("/api/reset-password", resetPassword);

app.get("/api/pending-register-shippers", getPendingRegisterShippers);
app.get("/api/pending-update-shippers", getUpdatingShippers);
app.get("/api/pending-cancel-shippers", getCancelingShippers);
app.post("/api/approve-shipper", approveShipper);
app.post("/api/reject-shipper", rejectRegisterShipper);
app.post("/api/change-shipper-status", changeShipperStatus);

app.get("/api/search-approved-shippers", searchApprovedShippers);
app.get("/api/search-pending-shippers", searchPendingShippers);
app.get("/api/search-updating-shippers", searchUpdatingShippers);
app.get("/api/search-canceling-shippers", searchCancelingShippers);

app.get("/api/getOrdersInProgress", getOrdersInProgress);
app.get("/api/getOrderDetails/:id", getOrderDetails);
app.post("/api/changeStatusOrder", changeStatusOrder);

app.post("/api/contact/submit", submitContact);
app.get("/api/contact/list", getContacts);
>>>>>>> dev

// app.put("/api/shippers/:id", updateShipper);

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
// API: Lấy thông tin chi tiết của shipper
app.get("/api/shippers/:id", getShipperDetails);
// API tìm kiếm shipper
app.get("/api/search-approved-shippers", searchApprovedShippers);

app.get("/api/search-pending-shippers", searchPendingShippers);

app.get("/api/search-updating-shippers", searchUpdatingShippers);

app.get("/api/search-canceling-shippers", searchCancelingShippers);
// API: Cập nhât trạng thái shipper
app.post("/api/change-shipper-status", changeShipperStatus);
// API: Chi tiết cập nhật thông tin shipper
app.get("/api/shipper-update-details/:id", getShipperUpdateDetails);


// 📌 --- REVENUE ROUTES ---

app.get('/api/overview', getRevenueOverview);
app.get('/api/by-day', getRevenueByDay);
app.get('/api/by-region', getRevenueByRegion);
app.get('/api/by-service', getRevenueByService);
app.get('/api/orders', getOrders);
app.get('/api/payments', getPayments);
app.get('/api/fees', getFees);
app.get('/api/alerts', getAlerts);

// Chạy server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
