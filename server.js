require('dotenv').config();
const express = require("express");
const cors = require("cors");
const { authenticateToken } = require('./controllers/middleware/authMiddleware');

// Import controllers
const { submitContact, getContacts } = require("./controllers/ContactController");
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
} = require("./controllers/Manageshipper");

const { loginShipper } = require("./controllers/Login");
const { addShipper, checkPhoneExists, checkEmailExists, checkCitizenIDExists } = require('./controllers/ShipperRegister');
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
    changeStatusOrder,
    getOrderDetails,
    getOrdersPending,
    getMyDeliveryOrders,
    getHistoryDeliveryOrders,
    pickOrder, confirmDeliveryOrder,
    getAllMyDeliveryOrders
} = require("./controllers/Order");
const {
    getShipperDetails,
    rejectRegisterShipper,
    approveShipper
} = require("./controllers/ShipperDetails");
const chatRoutes = require('./controllers/chatBox/ChatRoutes');

const {
    createOrderReport,
    createShipperReport,
    getOrderReports,
    getShipperReports,
    updateReportStatus,
    getCustomerOrderReports
} = require("./controllers/ReportController");

const { getShipperAccount, cancelShipperAccount, updateShipper, getWalletData, 
    getTotalWallet, depositToWallet, withdrawFromWallet , getOrderDetailsByDate } = require("./controllers/ShipperAccount");const app = express();
    const {getIncidentById,getIncidentCategories,getIncidentTimeStats,getIncidentTypeStats,getIncidentShipperStats,getIncidents,getSummaryStats,getShippers_Incident,exportReport}=require('./controllers/IncidentOp');

    // Notification
const { 
    getNotifications, 
    markAsRead, 
    createOrderNotification,
    markAllNotificationsAsRead 
} = require("./controllers/NotificationController");
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

app.put("/api/shippers/:id/update", updateShipper);
app.put("/api/shippers/:id/cancel", cancelShipperAccount);
app.get("/api/shipper/:id/raw-wallet", getWalletData);
app.get('/api/shipper/:id/total-wallet', getTotalWallet);
app.put("/api/shippers/:id", updateShipper);
app.post('/api/shipper/:id/deposit', depositToWallet);
app.post('/api/shipper/:id/withdraw', withdrawFromWallet);
app.get('/api/shipper/:id/orders-by-date', getOrderDetailsByDate);

app.get("/api/shippers-auth/:id", authenticateToken, getShipperAccount);
app.post("/api/approve-shipper", approveShipper);
app.post("/api/reject-shipper", rejectRegisterShipper);
// API: Lấy thông tin chi tiết của shipper
app.get("/api/shippers/:id", getShipperDetails);
app.get("/api/getOrdersPending", getOrdersPending);

//ShipperRegister Routes
app.post('/api/shippers', addShipper);
app.get('/api/check-phone/:phoneNumber', checkPhoneExists);
app.get('/api/check-email/:email', checkEmailExists);
app.get('/api/check-citizenid/:citizenId', checkCitizenIDExists);

//lấy order
app.get("/api/getOrderDetails/:id", getOrderDetails);
app.get("/api/get-my-delivery-order", getMyDeliveryOrders);
app.get("/api/get-history-delivery-order", getHistoryDeliveryOrders);
app.get("/api/getOrderDetails/:id", getOrderDetails);
app.put("/api/pickOrder", pickOrder);
app.put("/api/confirm-delivery-order", confirmDeliveryOrder);
app.get("/api/get-all-my-delivery-orders/:id", getAllMyDeliveryOrders);

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

app.put("/api/shippers/:id", updateShipper);

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

//API: Sự cố shipper
app.post("/api/reports/order", createOrderReport);
app.post("/api/reports/shipper", createShipperReport);
app.get("/api/order-reports", getOrderReports);
app.get("/api/shipper-reports", getShipperReports);
app.put("/api/reports/:reportId", updateReportStatus);
app.get("/api/customer-order-reports", getCustomerOrderReports);
app.put("/api/orders/:id/status", changeStatusOrder);
//API: Operator xem báo cáo sự cố
app.get("/api/incidents",getIncidents);

app.get("/api/incidents/categories",getIncidentCategories); 
//Get incident time stats
app.get("/api/incidents/time-stats",getIncidentTimeStats);
//Get incident type stats
app.get("/api/incidents/type-stats",getIncidentTypeStats);
//Get incident shipper stats
app.get("/api/incidents/shipper-stats",getIncidentShipperStats);
//Get summary stats
app.get("/api/incidents/summary-stats",getSummaryStats);
//Get shippers incident
app.get("/api/incidents/shippers",getShippers_Incident);
//Get incident by id
app.get("/api/incidents/:id",getIncidentById);
//Export report
app.get("/api/export-report",exportReport);

// API: AI
app.use('/api', chatRoutes);
//notifications
app.get("/api/notifications", getNotifications); // Lấy danh sách thông báo
app.put("/api/notifications/:id/read", markAsRead); // Đánh dấu thông báo đã đọc
app.put("/api/notifications/mark-all-read", markAllNotificationsAsRead);
// Chạy server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
