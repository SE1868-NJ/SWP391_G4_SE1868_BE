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

// API: Duyệt đăng ký shipper
const approveShipper = (req, res) => {
  const { id } = req.body;
  const sql = "UPDATE Shippers SET Status = 'Active' WHERE ShipperID = ? AND Status = 'PendingRegister'";

  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).send(err.message);
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Shipper không tồn tại hoặc không trong trạng thái chờ đăng ký" });
    }

    res.json({ message: "Shipper đã được duyệt thành công" });
  });
};
//API: Duyệt cập nhật thông tin shipper
const approveUpdateShipper = (req, res) => {
  const { id } = req.body;
  
  // SQL query to update the status to 'Updated' and 'Active'
  const sql = `
    UPDATE Shippers
    SET Status = 'Updated'
    WHERE ShipperID = ? AND Status = 'PendingUpdate';
    
    UPDATE Shippers
    SET Status = 'Active'
    WHERE ShipperID = ? AND Status = 'Updated';
  `;

  db.query(sql, [id, id], (err, result) => {
    if (err) {
      return res.status(500).send(err.message);
    }

    // Check if any rows were affected, meaning the shipper was found and updated
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Shipper không tồn tại hoặc không trong trạng thái chờ cập nhật" });
    }

    res.json({ message: "Shipper đã được duyệt cập nhật thành công và chuyển sang trạng thái Active" });
  });
};
//API: Duyệt hủy tài khoản shipper
const approveCancelShipper = (req, res) => {
  const { id } = req.body;
  const sql = "UPDATE Shippers SET Status = 'Inactive' WHERE ShipperID = ? AND Status = 'PendingCancel'";

  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).send(err.message);
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Shipper không tồn tại hoặc không trong trạng thái chờ hủy" });
    }

    res.json({ message: "Shipper đã được duyệt hủy thành công" });
  });
};

// API: Từ chối shipper
const rejectRegisterShipper = (req, res) => {
  const { id } = req.body;
  
  // Truy vấn SQL để xóa shipper khỏi bảng Shippers nếu trạng thái là 'PendingRegister'
  const sql = "DELETE FROM Shippers WHERE ShipperID = ? AND Status = 'PendingRegister'";

  db.query(sql, [id], (err, result) => {
    if (err) {
      // Nếu có lỗi trong quá trình truy vấn, trả về lỗi 500
      return res.status(500).send(err.message);
    }

    // Nếu không có dòng nào bị ảnh hưởng, nghĩa là không tìm thấy shipper trong trạng thái 'PendingRegister'
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Shipper không tồn tại hoặc không trong trạng thái chờ đăng ký" });
    }

    // Trả về thông báo thành công khi xóa shipper
    res.json({ message: "Shipper đã bị từ chối và xóa khỏi hệ thống" });
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


module.exports = { getShippers, getPendingRegisterShippers, approveShipper, rejectRegisterShipper, searchApprovedShippers, searchPendingShippers, getUpdatingShippers, getCancelingShippers, approveUpdateShipper, approveCancelShipper };
