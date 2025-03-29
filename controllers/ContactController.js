const db = require("../config/DBConnect");
const { sendConfirmationEmail, sendResponseEmail } = require("../config/EmailConfig");

// Xử lý lưu thông tin liên hệ shipper
const submitContact = async (req, res) => {
  const { name, email, phone, message } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!name || !email || !phone || !message) {
    return res.status(400).json({ success: false, message: "Vui lòng nhập đầy đủ thông tin." });
  }

  try {
    // Thêm dữ liệu vào database với status mặc định là 'Pending'
    const sql = "INSERT INTO contacts (name, email, phone, message, status) VALUES (?, ?, ?, ?, ?)";
    const [result] = await db.promise().query(sql, [name, email, phone, message, 'Pending']);

    // Gửi email xác nhận
    const emailSent = await sendConfirmationEmail(email, name);

    res.json({ 
      success: true, 
      message: "Gửi liên hệ thành công!", 
      contactId: result.insertId,
      emailConfirmation: emailSent ? "Email xác nhận đã được gửi" : "Gặp lỗi khi gửi email xác nhận"
    });
  } catch (err) {
    console.error("Lỗi:", err);
    res.status(500).json({ success: false, message: "Lỗi khi lưu liên hệ." });
  }
};

// Lấy danh sách liên hệ từ database
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

// Xử lý phản hồi và cập nhật status
const resolveContact = async (req, res) => {
  const { id } = req.params;
  const { responseMessage } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!responseMessage) {
    return res.status(400).json({ success: false, message: "Vui lòng nhập nội dung phản hồi." });
  }

  try {
    // Lấy thông tin liên hệ để gửi email
    const [contact] = await db.promise().query("SELECT * FROM contacts WHERE id = ?", [id]);
    if (!contact.length) {
      return res.status(404).json({ success: false, message: "Không tìm thấy liên hệ." });
    }

    const { email, name } = contact[0];

    // Gửi email phản hồi
    const emailSent = await sendResponseEmail(email, name, responseMessage);

    if (!emailSent) {
      return res.status(500).json({ success: false, message: "Gửi email phản hồi thất bại." });
    }

    // Cập nhật status thành 'Resolved' và lưu Response
    await db.promise().query(
      "UPDATE contacts SET status = ?, Response = ? WHERE id = ?",
      ["Resolved", responseMessage, id]
    );

    res.json({ success: true, message: "Phản hồi thành công và cập nhật trạng thái thành Resolved." });
  } catch (err) {
    console.error("Lỗi:", err);
    res.status(500).json({ success: false, message: "Lỗi khi xử lý liên hệ." });
  }
};

module.exports = { submitContact, getContacts, resolveContact };