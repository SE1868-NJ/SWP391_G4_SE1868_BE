const db = require("../config/DBConnect");

const loginShipper = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Vui lòng nhập email và mật khẩu." });
  }

  const sql = "SELECT * FROM shippers WHERE Email = ?";
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error("Lỗi truy vấn MySQL:", err);
      return res.status(500).json({ success: false, message: "Lỗi máy chủ." });
    }

    if (results.length === 0) {
      return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không đúng." });
    }

    const shipper = results[0];

    if (password !== shipper.Password) {
      return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không đúng." });
    }

    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.json({
      success: true,
      message: "Đăng nhập thành công!",
      shipper: {
        ShipperID: shipper.ShipperID,
        FullName: shipper.FullName,
        Email: shipper.Email,
      },
    });
  });
};

const forgotPassword = (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Vui lòng nhập email." });
  }

  const sql = "SELECT * FROM shippers WHERE Email = ?";
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error("Lỗi truy vấn MySQL:", err);
      return res.status(500).json({ success: false, message: "Lỗi máy chủ." });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "Email không tồn tại." });
    }

    res.json({ success: true, message: "Xác nhận email thành công. Vui lòng nhập mật khẩu mới." });
  });
};

const resetPassword = (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ success: false, message: "Vui lòng nhập email và mật khẩu mới." });
  }

  const sql = "UPDATE shippers SET Password = ? WHERE Email = ?";
  db.query(sql, [newPassword, email], (err, results) => {
    if (err) {
      console.error("Lỗi cập nhật MySQL:", err);
      return res.status(500).json({ success: false, message: "Lỗi máy chủ." });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Email không tồn tại." });
    }

    res.json({ success: true, message: "Cập nhật mật khẩu thành công!" });
  });
};

module.exports = { loginShipper, forgotPassword, resetPassword };
