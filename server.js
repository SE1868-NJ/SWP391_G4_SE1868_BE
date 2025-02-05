const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Cấu hình kết nối MySQL
const db = mysql.createConnection({
  host: "localhost", // Địa chỉ host MySQL (hoặc IP)
  user: "root",      // Tên người dùng MySQL
  password: "tai05112004", // Mật khẩu MySQL
  database: "swp_shipper", // Tên database
});

// Kết nối MySQL
db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err.message);
    return;
  }
  console.log("Connected to MySQL database!");
});

// API: Lấy danh sách shipper
app.get("/api/shippers", (req, res) => {
  const sql = "SELECT * FROM shippers";
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.json(results);
  });
});

// API: Thêm shipper mới
app.post("/api/shippers", (req, res) => {
  const { FullName, PhoneNumber, Email, DateOfBirth, Address, BankAccountNumber, VehicleDetails, Status } = req.body;
  
  const sql = `
    INSERT INTO Shippers (FullName, PhoneNumber, Email, DateOfBirth, Address, BankAccountNumber, VehicleDetails, Status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [FullName, PhoneNumber, Email, DateOfBirth, Address, BankAccountNumber, VehicleDetails, Status], (err, result) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.json({ message: "Shipper added successfully!", ShipperID: result.insertId });
  });
});

// Chạy server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
