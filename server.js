const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();

// Cấu hình CORS
const corsOptions = {
  origin: 'http://localhost:3000', // Cho phép yêu cầu từ frontend
  credentials: true, // Cho phép gửi credentials (cookies, authorization headers)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Các phương thức được phép
  allowedHeaders: ['Content-Type', 'Authorization'], // Các headers được phép
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Xử lý preflight request
app.options('*', cors(corsOptions));

// Kết nối MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "tai05112004",
  database: "swp_shipper",
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    process.exit(1); // Thoát nếu không kết nối được
  } else {
    console.log("Connected to MySQL database!");
  }
});

/**
 * API Đăng ký: Hash mật khẩu trước khi lưu vào database
 */
app.post("/api/register", async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ success: false, message: "Vui lòng điền đầy đủ thông tin." });
  }

  try {
    // Kiểm tra email đã tồn tại chưa
    const checkUserSql = "SELECT Email FROM Shippers WHERE Email = ?";
    db.query(checkUserSql, [email], async (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ success: false, message: "Lỗi cơ sở dữ liệu." });
      }

      if (results.length > 0) {
        return res.status(400).json({ success: false, message: "Email đã tồn tại!" });
      }

      // Hash mật khẩu trước khi lưu
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Chèn vào database
      const insertSql = "INSERT INTO Shippers (FullName, Email, Password) VALUES (?, ?, ?)";
      db.query(insertSql, [fullName, email, hashedPassword], (err, result) => {
        if (err) {
          console.error("Error inserting user:", err);
          return res.status(500).json({ success: false, message: "Lỗi khi tạo tài khoản." });
        }

        return res.json({ success: true, message: "Đăng ký thành công!" });
      });
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ success: false, message: "Lỗi server." });
  }
});

/**
 * API Đăng nhập: So sánh mật khẩu đã hash
 */
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email và mật khẩu là bắt buộc!" });
  }

  try {
    const sql = "SELECT * FROM Shippers WHERE Email = ?";

    db.query(sql, [email], async (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).json({ success: false, message: "Lỗi cơ sở dữ liệu." });
      }

      if (results.length === 0) {
        return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không chính xác." });
      }

      const shipper = results[0];

      try {
        const isMatch = await bcrypt.compare(password, shipper.Password);

        if (isMatch) {
          const { Password, ...shipperData } = shipper;
          return res.json({ success: true, message: "Đăng nhập thành công!", shipper: shipperData });
        } else {
          return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không chính xác." });
        }
      } catch (bcryptError) {
        console.error("Password comparison error:", bcryptError);
        return res.status(500).json({ success: false, message: "Lỗi xác thực mật khẩu." });
      }
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ success: false, message: "Lỗi server." });
  }
});

// Khởi động server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});