const db = require("../config/DBConnect");  // Kết nối cơ sở dữ liệu

// API: Lấy danh sách shipper
const getShippers = (req, res) => {
  const sql = "SELECT * FROM shippers";
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.json(results);
  });
};

// API: Thêm shipper mới
const addShipper = (req, res) => {
  const { FullName, PhoneNumber, Email, DateOfBirth, Address, BankAccountNumber, VehicleDetails, Status = "Active" } = req.body;

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
};

// API: Cập nhật shipper (cập nhật nhiều trường cùng lúc)
const updateShipper = (req, res) => {
  const { ShipperID, FullName, PhoneNumber, Email, DateOfBirth, Address, BankAccountNumber, VehicleDetails, Status } = req.body;

  // Câu lệnh SQL động để cập nhật các trường có giá trị
  let sql = "UPDATE Shippers SET ";
  let values = [];

  if (FullName) {
    sql += "FullName = ?, ";
    values.push(FullName);
  }
  if (PhoneNumber) {
    sql += "PhoneNumber = ?, ";
    values.push(PhoneNumber);
  }
  if (Email) {
    sql += "Email = ?, ";
    values.push(Email);
  }
  if (DateOfBirth) {
    sql += "DateOfBirth = ?, ";
    values.push(DateOfBirth);
  }
  if (Address) {
    sql += "Address = ?, ";
    values.push(Address);
  }
  if (BankAccountNumber) {
    sql += "BankAccountNumber = ?, ";
    values.push(BankAccountNumber);
  }
  if (VehicleDetails) {
    sql += "VehicleDetails = ?, ";
    values.push(VehicleDetails);
  }
  if (Status) {
    sql += "Status = ?, ";
    values.push(Status);
  }

  // Loại bỏ dấu phẩy thừa ở cuối câu lệnh SQL
  sql = sql.slice(0, -2);  // Xóa dấu phẩy cuối cùng

  sql += " WHERE ShipperID = ?";  // Thêm điều kiện WHERE để xác định shipper nào cần cập nhật
  values.push(ShipperID);

  db.query(sql, values, (err, result) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.json({ message: "Shipper updated successfully!" });
  });
};

module.exports = { getShippers, addShipper, updateShipper };
