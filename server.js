const express = require("express");
const cors = require("cors");
const { authenticateToken } = require('./controllers/middleware/authMiddleware');

// Import controllers
const { submitContact, getContacts } = require("./controllers/contactController");
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
} = require("./controllers/ManageShipper");

const { loginShipper } = require("./controllers/Login");
const { forgotPassword, resetPassword } = require("./controllers/ForgotPassword");
const {
    getRevenueOverview,
    getRevenueByDay,
    getRevenueByRegion,
    getRevenueByService,
    getOrders,
    getPayments,
    getFees,
    getAlerts
} = require("./controllers/RevenueOp");

const { 
    getShipperDetails, 
    rejectRegisterShipper, 
    approveShipper 
} = require("./controllers/ShipperDetails");

const { getShipperAccount } = require("./controllers/ShipperAccount");

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
app.get("/api/shippers/:id", getShipperDetails);
app.get("/api/shippers-auth/:id", authenticateToken, getShipperAccount);

// Authentication Routes
app.post("/api/login", loginShipper);
app.post("/api/forgot-password", forgotPassword);
app.post("/api/reset-password", resetPassword);

// Shipper Management Routes
app.get("/api/pending-register-shippers", getPendingRegisterShippers);
app.get("/api/pending-update-shippers", getUpdatingShippers);
app.get("/api/pending-cancel-shippers", getCancelingShippers);

app.post("/api/approve-shipper", approveShipper);
app.post("/api/reject-shipper", rejectRegisterShipper);
app.post("/api/change-shipper-status", changeShipperStatus);

// Search Routes
app.get("/api/search-approved-shippers", searchApprovedShippers);
app.get("/api/search-pending-shippers", searchPendingShippers);
app.get("/api/search-updating-shippers", searchUpdatingShippers);
app.get("/api/search-canceling-shippers", searchCancelingShippers);

app.get("/api/shipper-update-details/:id", getShipperUpdateDetails);

// 📌 --- REVENUE ROUTES ---
app.get("/api/revenue-overview", getRevenueOverview);
app.get("/api/revenue-by-day", getRevenueByDay);
app.get("/api/revenue-by-region", getRevenueByRegion);
app.get("/api/revenue-by-service", getRevenueByService);
app.get('/api/orders', getOrders);
app.get("/api/payments", getPayments);
app.get("/api/fees", getFees);
app.get("/api/alerts", getAlerts);

// Contact Routes
app.post("/api/contact/submit", submitContact);
app.get("/api/contact/list", getContacts);

// Chạy server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});