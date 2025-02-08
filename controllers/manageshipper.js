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
  console.log("Request body:", req.body);
  const { FullName, PhoneNumber, Email, DateOfBirth, Address, BankAccountNumber, VehicleDetails, Status = "Active", Password } = req.body;

// Kiểm tra các trường bắt buộc
if (!FullName || !PhoneNumber || !Email || !Password) {
  return res.status(400).json({ error: "FullName, PhoneNumber, Email, and Password are required" });
}
const checkExistQuery = `SELECT * FROM Shippers WHERE PhoneNumber = ? OR Email = ?`;

  db.query(checkExistQuery, [PhoneNumber, Email], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "" + err.message });
    }

    if (results.length > 0) {
      const existing = results[0];
      if (existing.PhoneNumber === PhoneNumber) {
        return res.status(400).json({ error: "PhoneNumber đã được sử dụng" });
      }
      if (existing.Email === Email) {
        return res.status(400).json({ error: "Email đã được sử dụng" });
      }
    }
  });

  const sql = `
    INSERT INTO Shippers (FullName, PhoneNumber, Email, DateOfBirth, Address, BankAccountNumber, VehicleDetails, Status, Password)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [FullName, PhoneNumber, Email, DateOfBirth, Address, BankAccountNumber, VehicleDetails, Status, Password], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Database error: " + err.message });
    }
    res.json({ message: "Shipper added successfully!", ShipperID: result.insertId });
  });
};


// API: Cập nhật shipper (cập nhật nhiều trường cùng lúc)
const updateShipper = (req, res) => {
  const { ShipperID, FullName, PhoneNumber, Email, Password, DateOfBirth, Address, BankAccountNumber, VehicleDetails, Status } = req.body;

  if (!ShipperID) {
    return res.status(400).json({ error: "ShipperID is required for updating" });
  }

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
  if (Password) {  
    sql += "Password = ?, ";
    values.push(Password);
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

  // Nếu không có trường nào cần cập nhật, báo lỗi
  if (values.length === 0) {
    return res.status(400).json({ error: "At least one field is required for updating" });
  }

  sql = sql.slice(0, -2);  // Xóa dấu phẩy cuối
  sql += " WHERE ShipperID = ?";
  values.push(ShipperID);

  db.query(sql, values, (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Database error: " + err.message });
    }
    res.json({ message: "Shipper updated successfully!" });
  });
};



module.exports = { getShippers, addShipper, updateShipper };
