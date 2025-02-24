const express = require("express");
const cors = require("cors");
const { 
    getShippers, 
    getPendingRegisterShippers, 
    searchApprovedShippers, 
    searchPendingShippers,
    changeShipperStatus,
    getUpdatingShippers, 
    getCancelingShippers, 
    searchUpdatingShippers, 
    searchCancelingShippers 
} = require("./controllers/manageshipper");
const { loginShipper } = require("./controllers/Login");
const { forgotPassword, resetPassword } = require("./controllers/ForgotPassword");
const { getOrders, changeStatusOrder } = require("./controllers/Order");
const { submitContact, getContacts } = require("./controllers/ContactController");
const { updateShipper } = require("./controllers/ShipperAccount");
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

// Shipper Routes
app.get("/api/shippers", getShippers);
app.get("/api/active-shippers", getShippers);
app.get("/api/shippers/:id", getShipperDetails);
app.put("/api/shippers/:id", updateShipper);

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

// Order Routes
app.get("/api/getOrders", getOrders);
app.post("/api/changeStatusOrder", changeStatusOrder);

// Contact Routes
app.post("/api/contact/submit", submitContact);
app.get("/api/contact/list", getContacts);
app.post("/api/contact/submit", submitContact);


// Server Startup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});