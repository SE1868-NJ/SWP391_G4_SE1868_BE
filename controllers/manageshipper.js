const db = require("../config/DBConnect");

// API: Lấy danh sách shipper
const getShippers = (req, res) => {
  const sql = "SELECT * FROM Shippers where Status = 'Active'or Status = 'Inactive'";
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.json(results);
  });
};
// API: Lấy danh sách shipper đang chờ duyệt update
const getUpdatingShippers = (req, res) => {
  const sql = "SELECT * FROM Shippers where Status = 'PendingUpdate'";
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.json(results);
  });
};
// API: Lấy danh sách shipper đang chờ duyệt hủy tài khoản
const getCancelingShippers = (req, res) => {
  const sql = "SELECT * FROM Shippers where Status = 'PendingCancel'";
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.json(results);
  });
};
// API: Lấy danh sách shipper đang chờ duyệt
const getPendingRegisterShippers = (req, res) => {
  const sql = "SELECT * FROM Shippers WHERE Status = 'PendingRegister'";
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching shippers:', err);
      return res.status(500).json({ 
        success: false, 
        message: "Server error retrieving shippers" 
      });
    }
    res.json(results);
  });
};


//API: Duyệt cập nhật thông tin shipper
// const approveUpdateShipper = (req, res) => {
//   const { id } = req.body;
  
//   // SQL query to update the status to 'Updated' and 'Active'
//   const sql = `
//     UPDATE Shippers
//     SET Status = 'Updated'
//     WHERE ShipperID = ? AND Status = 'PendingUpdate';
    
//     UPDATE Shippers
//     SET Status = 'Active'
//     WHERE ShipperID = ? AND Status = 'Updated';
//   `;

//   db.query(sql, [id, id], (err, result) => {
//     if (err) {
//       return res.status(500).send(err.message);
//     }

//     // Check if any rows were affected, meaning the shipper was found and updated
//     if (result.affectedRows === 0) {
//       return res.status(404).json({ message: "Shipper không tồn tại hoặc không trong trạng thái chờ cập nhật" });
//     }

//     res.json({ message: "Shipper đã được duyệt cập nhật thành công và chuyển sang trạng thái Active" });
//   });
// };
// //API: Duyệt hủy tài khoản shipper
// const approveCancelShipper = (req, res) => {
//   const { id } = req.body;
//   const sql = "UPDATE Shippers SET Status = 'Inactive' WHERE ShipperID = ? AND Status = 'PendingCancel'";

//   db.query(sql, [id], (err, result) => {
//     if (err) {
//       return res.status(500).send(err.message);
//     }

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ message: "Shipper không tồn tại hoặc không trong trạng thái chờ hủy" });
//     }

//     res.json({ message: "Shipper đã được duyệt hủy thành công" });
//   });
// };



// API: Tìm kiếm shipper đã duyệt
const searchApprovedShippers = (req, res) => {
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: "Search query is required" });
  }

  const sql = `
    SELECT * FROM Shippers 
    WHERE (FullName LIKE ? OR PhoneNumber LIKE ? OR Email LIKE ?) 
    AND (Status = 'Active' OR Status = 'Inactive')
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
    SELECT * FROM Shippers
    WHERE (FullName LIKE ? OR PhoneNumber LIKE ? OR Email LIKE ?)
    AND Status = 'PendingRegister'
  `;

  const searchQuery = `%${query}%`;

  db.query(sql, [searchQuery, searchQuery, searchQuery], (err, results) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.json(results);
  });
};
// API: Tìm kiếm shipper đang chờ cập nhật
const searchUpdatingShippers = (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: "Search query is required" });
  }

  const sql = `
    SELECT * FROM Shippers
    WHERE (FullName LIKE ? OR PhoneNumber LIKE ? OR Email LIKE ?)
    AND Status = 'PendingUpdate'
  `;

  const searchQuery = `%${query}%`;

  db.query(sql, [searchQuery, searchQuery, searchQuery], (err, results) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.json(results);
  });
};
// API: Tìm kiếm shipper đang chờ hủy
const searchCancelingShippers = (req, res) => {
  const { query } = req.query;

  if (!query) { 
    return res.status(400).json({ error: "Search query is required" });
  }

  const sql = `
    SELECT * FROM Shippers
    WHERE (FullName LIKE ? OR PhoneNumber LIKE ? OR Email LIKE ?)
    AND Status = 'PendingCancel'
  `;

  const searchQuery = `%${query}%`;

  db.query(sql, [searchQuery, searchQuery, searchQuery], (err, results) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.json(results);
  });
};
const changeShipperStatus = (req, res) => {
  const { id, newStatus, cancelReason, cancelTime } = req.body;

  // Trường hợp chuyển từ PendingCancel sang Inactive (hủy tài khoản)
  if (newStatus === 'Inactive' && cancelReason) {
    const sql = `
      UPDATE Shippers 
      SET 
        Status = ?, 
        CancelReason = ?, 
        CancelTime = ?
      WHERE ShipperID = ? AND Status = 'PendingCancel'
    `;
    
    db.query(sql, [newStatus, cancelReason, cancelTime, id], (err, result) => {
      if (err) {
        return res.status(500).send(err.message);
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Không tìm thấy shipper hoặc shipper không ở trạng thái chờ hủy" });
      }

      res.json({ 
        message: "Đã hủy tài khoản shipper thành công",
        status: newStatus
      });
    });
  }
  // Trường hợp chuyển từ PendingUpdate sang Active
  else if (newStatus === 'Active') {
    // Đầu tiên kiểm tra xem shipper có đang ở trạng thái PendingUpdate không
    const checkStatusSql = "SELECT Status FROM Shippers WHERE ShipperID = ?";
    
    db.query(checkStatusSql, [id], (err, results) => {
      if (err) {
        return res.status(500).send(err.message);
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "Không tìm thấy shipper" });
      }

      if (results[0].Status === 'PendingUpdate') {
        // Cập nhật từ các trường temp sang trường chính và xóa dữ liệu ở trường temp
        const updateSql = `
          UPDATE Shippers
          SET 
            PhoneNumber = CASE WHEN TempPhoneNumber IS NOT NULL THEN TempPhoneNumber ELSE PhoneNumber END,
            Email = CASE WHEN TempEmail IS NOT NULL THEN TempEmail ELSE Email END,
            Ward = CASE WHEN TempWard IS NOT NULL THEN TempWard ELSE Ward END,
            District = CASE WHEN TempDistrict IS NOT NULL THEN TempDistrict ELSE District END,
            City = CASE WHEN TempCity IS NOT NULL THEN TempCity ELSE City END,
            BankName = CASE WHEN TempBankName IS NOT NULL THEN TempBankName ELSE BankName END,
            BankAccountNumber = CASE WHEN TempBankAccountNumber IS NOT NULL THEN TempBankAccountNumber ELSE BankAccountNumber END,
            VehicleType = CASE WHEN TempVehicleType IS NOT NULL THEN TempVehicleType ELSE VehicleType END,
            LicensePlate = CASE WHEN TempLicensePlate IS NOT NULL THEN TempLicensePlate ELSE LicensePlate END,
            RegistrationVehicle = CASE WHEN TempRegistrationVehicle IS NOT NULL THEN TempRegistrationVehicle ELSE RegistrationVehicle END,
            ExpiryVehicle = CASE WHEN TempExpiryVehicle IS NOT NULL THEN TempExpiryVehicle ELSE ExpiryVehicle END,
            VehicleRegistrationImage = CASE WHEN TempVehicleRegistrationImage IS NOT NULL THEN TempVehicleRegistrationImage ELSE VehicleRegistrationImage END,
            ImageShipper = CASE WHEN TempImageShipper IS NOT NULL THEN TempImageShipper ELSE ImageShipper END,
            Status = ?,
            TempPhoneNumber = NULL,
            TempEmail = NULL,
            TempWard = NULL,
            TempDistrict = NULL,
            TempCity = NULL,
            TempBankName = NULL,
            TempBankAccountNumber = NULL,
            TempVehicleType = NULL,
            TempLicensePlate = NULL,
            TempRegistrationVehicle = NULL,
            TempExpiryVehicle = NULL,
            TempVehicleRegistrationImage = NULL,
            TempImageShipper = NULL
          WHERE ShipperID = ?
        `;

        db.query(updateSql, [newStatus, id], (updateErr, updateResult) => {
          if (updateErr) {
            return res.status(500).send(updateErr.message);
          }

          if (updateResult.affectedRows === 0) {
            return res.status(404).json({ message: "Không thể cập nhật thông tin shipper" });
          }

          res.json({ 
            message: "Đã cập nhật thông tin và chuyển trạng thái shipper thành công",
            status: newStatus
          });
        });
      } else {
        // Nếu không phải chuyển từ PendingUpdate, chỉ cập nhật trạng thái
        const simpleSql = "UPDATE Shippers SET Status = ? WHERE ShipperID = ?";
        
        db.query(simpleSql, [newStatus, id], (err, result) => {
          if (err) {
            return res.status(500).send(err.message);
          }

          if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Không tìm thấy shipper" });
          }

          res.json({ 
            message: "Đã cập nhật trạng thái shipper thành công",
            status: newStatus
          });
        });
      }
    });
  } else {
    // Nếu không phải chuyển sang Active hoặc từ PendingCancel sang Inactive, chỉ cập nhật trạng thái
    const sql = "UPDATE Shippers SET Status = ? WHERE ShipperID = ?";
    
    db.query(sql, [newStatus, id], (err, result) => {
      if (err) {
        return res.status(500).send(err.message);
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Không tìm thấy shipper" });
      }

      res.json({ 
        message: "Đã cập nhật trạng thái shipper thành công",
        status: newStatus
      });
    });
  }
};
// API: Lấy chi tiết shipper đang cập nhật
const getShipperUpdateDetails = (req, res) => {
  const { id } = req.params;
  
  const sql = `
    SELECT * FROM Shippers
    WHERE ShipperID = ? AND Status = 'PendingUpdate'
  `;
  
  db.query(sql, [id], (err, results) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy thông tin cập nhật của shipper" });
    }
    
    res.json(results[0]);
  });
};
module.exports = { getShippers, getPendingRegisterShippers, searchApprovedShippers, searchPendingShippers, getUpdatingShippers, getCancelingShippers, searchUpdatingShippers, searchCancelingShippers, changeShipperStatus, getShipperUpdateDetails };
