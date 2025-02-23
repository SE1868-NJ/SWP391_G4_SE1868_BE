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
  const { id, newStatus } = req.body;
  const sql = `
    UPDATE Shippers
    SET Status = ?
    WHERE ShipperID = ?
  `;

  db.query(sql, [newStatus, id], (err, result) => {
    if (err) {
      return res.status(500).send(err.message);
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Shipper không tồn tại" });
    }

    res.json({ message: "Trạng thái shipper đã được thay đổi thành công" });
  });
};
module.exports = { getShippers, getPendingRegisterShippers, searchApprovedShippers, searchPendingShippers, getUpdatingShippers, getCancelingShippers, searchUpdatingShippers, searchCancelingShippers, changeShipperStatus };
