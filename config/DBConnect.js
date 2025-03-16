const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",         // Địa chỉ host MySQL (hoặc IP)
  user: "root",              // Tên người dùng MySQL
  password: "tai05112004", // Mật khẩu MySQL
  database: "swp_shipper",   // Tên database
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err.message);
    return;
  }
  console.log("Connected to MySQL database!");
});

module.exports = db;