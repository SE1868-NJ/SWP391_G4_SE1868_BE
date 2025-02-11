const db = require("../config/DBConnect");  // Kết nối cơ sở dữ liệu

// API: Lấy danh sách shipper đã được duyệt
const getApprovedShippers = (req, res) => {
  const sql = "SELECT * FROM Shippers";
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.json(results);
  });
};

// API: Lấy danh sách shipper đang chờ duyệt
const getPendingShippers = (req, res) => {
  const sql = "SELECT * FROM shipper_registration WHERE RegistrationStatus = 'pending'";
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.json(results);
  });
};

// // API: Thêm shipper mới
// const addShipper = (req, res) => {
//   console.log("Request body:", req.body);
//   const { FullName, PhoneNumber, Email, DateOfBirth, Address, BankAccountNumber, VehicleDetails, Status = "Active", Password } = req.body;

// // Kiểm tra các trường bắt buộc
// if (!FullName || !PhoneNumber || !Email || !Password) {
//   return res.status(400).json({ error: "FullName, PhoneNumber, Email, and Password are required" });
// }
// const checkExistQuery = `SELECT * FROM Shippers WHERE PhoneNumber = ? OR Email = ?`;

//   db.query(checkExistQuery, [PhoneNumber, Email], (err, results) => {
//     if (err) {
//       return res.status(500).json({ error: "" + err.message });
//     }

//     if (results.length > 0) {
//       const existing = results[0];
//       if (existing.PhoneNumber === PhoneNumber) {
//         return res.status(400).json({ error: "PhoneNumber đã được sử dụng" });
//       }
//       if (existing.Email === Email) {
//         return res.status(400).json({ error: "Email đã được sử dụng" });
//       }
//     }
//   });

//   const sql = `
//     INSERT INTO Shippers (FullName, PhoneNumber, Email, DateOfBirth, Address, BankAccountNumber, VehicleDetails, Status, Password)
//     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//   `;

//   db.query(sql, [FullName, PhoneNumber, Email, DateOfBirth, Address, BankAccountNumber, VehicleDetails, Status, Password], (err, result) => {
//     if (err) {
//       return res.status(500).json({ error: "Database error: " + err.message });
//     }
//     res.json({ message: "Shipper added successfully!", ShipperID: result.insertId });
//   });
// };

// API: Duyệt shipper
const approveShipper = (req, res) => {
  const { id } = req.body;
  const insertSQL = `
  INSERT INTO Shippers (FullName, PhoneNumber, Email, DateOfBirth, Address, BankAccountNumber, VehicleDetails, Status, Password)
  SELECT FullName, PhoneNumber, Email, DateOfBirth, Address, BankAccountNumber, VehicleDetails, 'Active', Password
  FROM shipper_registration WHERE id = ?`;
  const deleteSQL = "DELETE FROM shipper_registration WHERE id = ?";
  
  db.query(insertSQL, [id], (err) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    db.query(deleteSQL, [id], (err) => {
      if (err) {
        return res.status(500).send(err.message);
      }
      res.json({ message: "Shipper approved successfully" });
    });
  });
};

// API: Từ chối shipper
const rejectShipper = (req, res) => {
  const { id } = req.body;
  const sql = "UPDATE shipper_registration SET RegistrationStatus = 'rejected' WHERE id = ?";
  
  db.query(sql, [id], (err) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.json({ message: "Shipper rejected successfully" });
  });
};

// API: Cập nhật thông tin shipper
const updateShipper = (req, res) => {
  console.log("🔹 Received update request:", req.body); // Kiểm tra request có đến không

  const { ShipperID, FullName, PhoneNumber, Email, DateOfBirth, Address, BankAccountNumber, VehicleDetails, Status, Password } = req.body;

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
  if (DateOfBirth) {
    sql += "DateOfBirth = ?, ";
    values.push(new Date(DateOfBirth).toISOString().split('T')[0]); // Format YYYY-MM-DD
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
  if (Password) { // Chỉ cập nhật nếu có Password
    sql += "Password = ?, ";
    values.push(Password);
  }

  if (values.length === 0) {
    return res.status(400).json({ error: "At least one field must be provided for updating" });
  }

  sql = sql.slice(0, -2);  // Xóa dấu phẩy cuối
  sql += " WHERE ShipperID = ?";
  values.push(ShipperID);

  console.log("🔹 Executing SQL:", sql);
  console.log("🔹 With values:", values);

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("❌ Database error:", err);
      return res.status(500).json({ error: "Database error: " + err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "No shipper found with this ShipperID" });
    }

    console.log("✅ Shipper updated successfully!");
    res.json({ message: "Shipper updated successfully!" });
  });
};
// API: Tìm kiếm shipper đã duyệt
const searchApprovedShippers = (req, res) => {
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: "Search query is required" });
  }

  const sql = `
    SELECT * FROM Shippers 
    WHERE FullName LIKE ? OR PhoneNumber LIKE ? OR Email LIKE ?
  `;

  const searchQuery = `%${query}%`;

  db.query(sql, [searchQuery, searchQuery, searchQuery], (err, results) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.json(results);
  });
};

// API: Tìm kiếm shipper đang chờ duyệt
const searchPendingShippers = (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: "Search query is required" });
  }

  const sql = `
    SELECT * FROM shipper_registration
    WHERE FullName LIKE ? OR PhoneNumber LIKE ? OR Email LIKE ?
  `;

  const searchQuery = `%${query}%`;

  db.query(sql, [searchQuery, searchQuery, searchQuery], (err, results) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.json(results);
  });
};


module.exports = { getApprovedShippers, getPendingShippers, approveShipper, rejectShipper, updateShipper, searchApprovedShippers, searchPendingShippers };
