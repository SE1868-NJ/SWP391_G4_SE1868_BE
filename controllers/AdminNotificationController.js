const db = require("../config/DBConnect");

// Lấy danh sách thông báo
const getAdminNotifications = (req, res) => {
  const sql = "SELECT * FROM adminnotification ORDER BY CreatedAt DESC";
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    res.json({ success: true, notifications: results });
  });
};

// Tạo thông báo mới
const createAdminNotification = (req, res) => {
  const { Title, Message, Type } = req.body;
  if (!Title || !Message || !Type) {
    return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" });
  }

  const sql = "INSERT INTO adminnotification (Title, Message, Type) VALUES (?, ?, ?)";
  db.query(sql, [Title, Message, Type], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    res.status(201).json({
      success: true,
      message: "Thông báo đã được tạo",
      AdminNotificationID: result.insertId,
    });
  });
};

// Đánh dấu thông báo là đã đọc
const markAsRead = (req, res) => {
  const { id } = req.params;
  const sql = "UPDATE adminnotification SET IsRead = 1 WHERE AdminNotificationID = ?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy thông báo" });
    }
    res.json({ success: true, message: "Thông báo đã được đánh dấu là đã đọc" });
  });
};

// Đánh dấu tất cả thông báo là đã đọc
const markAllAsRead = (req, res) => {
  const sql = "UPDATE adminnotification SET IsRead = 1 WHERE IsRead = 0";
  db.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    res.json({ success: true, message: "Tất cả thông báo đã được đánh dấu là đã đọc" });
  });
};

// Xóa thông báo (tùy chọn)
const deleteAdminNotification = (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM adminnotification WHERE AdminNotificationID = ?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy thông báo" });
    }
    res.json({ success: true, message: "Thông báo đã được xóa" });
  });
};

module.exports = {
  getAdminNotifications,
  createAdminNotification,
  markAsRead,
  markAllAsRead,
  deleteAdminNotification,
};