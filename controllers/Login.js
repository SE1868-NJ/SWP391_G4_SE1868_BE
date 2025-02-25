const db = require("../config/DBConnect");

const loginShipper = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Vui lòng nhập email và mật khẩu." });
  }

  try {
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

      if (!shipper.Password) {
        return res.status(401).json({ success: false, message: "Mật khẩu không hợp lệ." });
      }

      if (password !== shipper.Password) {
        return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không đúng." });
      }

      // Kiểm tra trạng thái tài khoản
      if (shipper.Status === "Inactive") {
        return res.status(403).json({ 
          success: false, 
          message: "Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên." 
        });
      }

      if (shipper.Status === "PendingRegister") {
        return res.status(403).json({ 
          success: false, 
          message: "Tài khoản của bạn đang chờ được duyệt. Vui lòng thử lại sau." 
        });
      }

      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.json({
        success: true,
        message: "Đăng nhập thành công!",
        shipper: {
          ShipperID: shipper.ShipperID,
          FullName: shipper.FullName,
          Email: shipper.Email,
          Status: shipper.Status
        },
      });
    });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ, vui lòng thử lại sau." });
  }
};

module.exports = { loginShipper };