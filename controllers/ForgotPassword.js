const db = require('../config/DBConnect');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Lưu trữ token tạm thời (trong thực tế nên dùng Redis)
const resetTokens = new Map();

// Sinh token ngẫu nhiên
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

exports.forgotPassword = (req, res) => {
  const { email } = req.body;

  // Kiểm tra email
  if (!email) {
    console.log('Forgot Password: Không có email');
    return res.status(400).json({ 
      success: false, 
      message: "Vui lòng nhập email." 
    });
  }

  // Truy vấn kiểm tra email
  const sql = "SELECT * FROM shippers WHERE Email = ?";
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error("Lỗi truy vấn MySQL chi tiết:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Lỗi máy chủ: " + err.message 
      });
    }

    // Không tìm thấy email
    if (results.length === 0) {
      console.log(`Không tìm thấy email: ${email}`);
      return res.status(404).json({ 
        success: false, 
        message: "Email không tồn tại trong hệ thống." 
      });
    }

    // Tạo token đặt lại mật khẩu
    const resetToken = generateResetToken();

    // Lưu token với thời gian hết hạn
    resetTokens.set(email, {
      token: resetToken,
      expires: Date.now() + 15 * 60 * 1000 // 15 phút
    });

    // Phản hồi thành công
    res.status(200).json({ 
      success: true, 
      message: "Mã xác nhận đã được tạo. Vui lòng nhập mã.",
      resetToken: resetToken 
    });
  });
};

exports.resetPassword = (req, res) => {
  const { email, resetToken, newPassword } = req.body;

  // Kiểm tra đầu vào
  if (!email || !resetToken || !newPassword) {
    return res.status(400).json({ 
      success: false, 
      message: "Vui lòng cung cấp đầy đủ thông tin." 
    });
  }

  // Kiểm tra token
  const tokenData = resetTokens.get(email);
  if (!tokenData || tokenData.token !== resetToken || tokenData.expires < Date.now()) {
    return res.status(400).json({ 
      success: false, 
      message: "Mã xác nhận không hợp lệ hoặc đã hết hạn." 
    });
  }

  // Mã hóa mật khẩu mới
  const saltRounds = 10;
  const hashedPassword = bcrypt.hashSync(newPassword, saltRounds);

  // Cập nhật mật khẩu
  const sql = "UPDATE shippers SET Password = ? WHERE Email = ?";
  db.query(sql, [hashedPassword, email], (err, results) => {
    if (err) {
      console.error("Lỗi cập nhật MySQL:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Lỗi máy chủ: " + err.message 
      });
    }

    // Xóa token đã sử dụng
    resetTokens.delete(email);

    res.status(200).json({ 
      success: true, 
      message: "Mật khẩu đã được cập nhật thành công!" 
    });
  });
};