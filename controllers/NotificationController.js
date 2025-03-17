const db = require("../config/DBConnect");

// Lấy danh sách thông báo
const getNotifications = (req, res) => {
    const shipperId = req.query.shipperId;
    const sql = "SELECT * FROM notifications WHERE shipperId = ? ORDER BY timestamp DESC";
    db.query(sql, [shipperId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ notifications: results });
    });
};

// Đánh dấu thông báo là đã đọc
const markAsRead = (req, res) => {
    const notificationId = req.params.id;
    const sql = "UPDATE notifications SET unread = 0 WHERE id = ?";
    db.query(sql, [notificationId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: "Không tìm thấy thông báo" });
        res.json({ success: true, message: "Đã đánh dấu thông báo là đã đọc" });
    });
};

// Đánh dấu tất cả thông báo là đã đọc
const markAllNotificationsAsRead = (req, res) => {
    const { shipperId } = req.body;
    const sql = "UPDATE notifications SET unread = 0 WHERE shipperId = ?";
    
    db.query(sql, [shipperId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ 
            success: true, 
            message: "Tất cả thông báo đã được đánh dấu đọc",
            affectedRows: result.affectedRows 
        });
    });
};

// Tạo thông báo mới
const createNotification = (shipperId, message) => {
    return new Promise((resolve, reject) => {
        const sql = "INSERT INTO notifications (shipperId, message, unread, timestamp) VALUES (?, ?, 1, NOW())";
        db.query(sql, [shipperId, message], (err, result) => {
            if (err) {
                console.error("Lỗi tạo thông báo:", err);
                reject(err);
            }
            resolve(result);
        });
    });
};

// Thêm vào các controller khác để tạo thông báo
const createOrderNotification = (shipperId, orderId, status) => {
    let message = '';
    switch(status) {
        case 'Pending':
            message = `Đơn hàng #${orderId} mới được tạo`;
            break;
        case 'InProgress':
            message = `Đơn hàng #${orderId} đã được nhận`;
            break;
        case 'Delivered':
            message = `Đơn hàng #${orderId} đã được giao thành công`;
            break;
        case 'Cancelled':
            message = `Đơn hàng #${orderId} đã bị hủy`;
            break;
        default:
            message = `Trạng thái đơn hàng #${orderId} đã thay đổi`;
    }
    
    return createNotification(shipperId, message);
};

module.exports = { 
    getNotifications, 
    markAsRead, 
    createNotification,
    createOrderNotification,
    markAllNotificationsAsRead
};