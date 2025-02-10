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

module.exports = { getShippers, addShipper, };