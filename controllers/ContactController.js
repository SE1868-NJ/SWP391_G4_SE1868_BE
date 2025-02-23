const db = require("../config/DBConnect");

const submitContact = (req, res) => {
  const { name, email, phone, message } = req.body;

  if (!name || !email || !phone || !message) {
    return res.status(400).json({ success: false, message: "Vui lòng nhập đầy đủ thông tin." });
  }

  const sql = "INSERT INTO contacts (name, email, phone, message) VALUES (?, ?, ?, ?)";
  db.query(sql, [name, email, phone, message], (err, result) => {
    if (err) {
      console.error("Lỗi MySQL:", err);
      return res.status(500).json({ success: false, message: "Lỗi khi lưu liên hệ." });
    }
    res.json({ success: true, message: "Gửi liên hệ thành công!", contactId: result.insertId });
  });
};

const getContacts = (req, res) => {
  const sql = "SELECT * FROM contacts ORDER BY created_at DESC";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Lỗi MySQL:", err);
      return res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách liên hệ." });
    }
    res.json({ success: true, contacts: results });
  });
};

module.exports = { submitContact, getContacts };