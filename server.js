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
} = require("./controllers/manageshipper");

const { loginShipper } = require("./controllers/Login");
const { forgotPassword, resetPassword } = require("./controllers/ForgotPassword");
const { getOrdersInProgress, changeStatusOrder, getOrderDetails } = require("./controllers/order");
// const { updateShipper } = require("./controllers/ShipperAccount");
const { 
    getShipperDetails, 
    rejectRegisterShipper, 
    approveShipper 
} = require("./controllers/ShipperDetails");

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
app.get("/api/shippers/:id", authenticateToken, getShipperDetails);
app.post("/api/approve-shipper", approveShipper);
app.post("/api/reject-shipper", rejectRegisterShipper);
// API: Lấy thông tin chi tiết của shipper
app.get("/api/shippers/:id", getShipperDetails);

app.post("/api/login", loginShipper);
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

// app.put("/api/shippers/:id", updateShipper);

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
