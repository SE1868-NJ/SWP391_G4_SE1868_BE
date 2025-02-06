const db = require("../config/DBConnect");  

const getShippers = (req, res) => {
  const sql = "SELECT * FROM shippers";
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.json(results);
  });
};
// Thêm route để lấy thông tin shipper theo ShipperID
const getShipperById = (req, res) => {
  const shipperId = req.params.shipperId;
  const sql = "SELECT * FROM shippers WHERE ShipperID = ?";
  db.query(sql, [shipperId], (err, results) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).json({ message: "Shipper không tìm thấy" });
    }
  });
};
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

module.exports = { getShippers, addShipper, getShipperById };