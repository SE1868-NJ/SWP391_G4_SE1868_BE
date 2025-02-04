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

module.exports = { getShippers, addShipper };