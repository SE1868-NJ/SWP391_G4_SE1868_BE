const express = require("express");
const cors = require("cors");
const { 
  getShippers, 
  addShipper, 
  getShipperById 
} = require("./controllers/manageshipper");
const { loginShipper } = require("./controllers/Login");
const { forgotPassword, resetPassword } = require("./controllers/ForgotPassword");
const { getOrders, changeStatusOrder } = require("./controllers/Order");

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: "http://localhost:3000", 
  credentials: true,
  methods: ["GET", "POST", "PUT", "OPTIONS"], 
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
app.post("/api/shippers", addShipper);
app.get("/api/getShipperById", getShipperById);
app.post("/api/login", loginShipper);
app.post("/api/forgot-password", forgotPassword);
app.post("/api/reset-password", resetPassword);
app.get("/api/getOrders", getOrders);
app.post("/api/changeStatusOrder", changeStatusOrder);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});