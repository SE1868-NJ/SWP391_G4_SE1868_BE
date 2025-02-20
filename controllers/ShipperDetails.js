const db = require('../config/DBConnect');


// API lấy chi tiết shipper theo ID
const getShipperDetails = (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM shippers WHERE ShipperID = ?', [id], (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(result[0]);
    });
  };
// API từ chối đăng ký shipper
  const rejectRegisterShipper = (req, res) => {
    const { shipperId } = req.body;
    
    try {
        // Kiểm tra xem shipper có tồn tại và đang trong trạng thái PendingRegister không
        const checkSql = "SELECT * FROM Shippers WHERE ShipperID = ? AND Status = 'PendingRegister'";
        db.query(checkSql, [shipperId], (checkErr, checkResult) => {
            if (checkErr) {
                return res.status(500).json({
                    success: false,
                    message: "Lỗi khi kiểm tra thông tin shipper",
                    error: checkErr.message
                });
            }

            if (checkResult.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Không tìm thấy shipper hoặc shipper không trong trạng thái chờ duyệt"
                });
            }

            // Thực hiện xóa shipper
            const deleteSql = "DELETE FROM Shippers WHERE ShipperID = ?";
            db.query(deleteSql, [shipperId], (deleteErr, deleteResult) => {
                if (deleteErr) {
                    return res.status(500).json({
                        success: false,
                        message: "Lỗi khi xóa shipper",
                        error: deleteErr.message
                    });
                }

                res.json({
                    success: true,
                    message: "Đã từ chối và xóa shipper thành công",
                    data: {
                        shipperId: shipperId,
                        affectedRows: deleteResult.affectedRows
                    }
                });
            });
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi server",
            error: error.message
        });
    }
  };
// API: Duyệt đăng ký shipper
const approveShipper = (req, res) => {
    const { shipperId } = req.body;
    
    try {
        // Kiểm tra xem shipper có tồn tại và đang trong trạng thái PendingRegister không
        const checkSql = "SELECT * FROM Shippers WHERE ShipperID = ? AND Status = 'PendingRegister'";
        db.query(checkSql, [shipperId], (checkErr, checkResult) => {
            if (checkErr) {
                return res.status(500).json({
                    success: false,
                    message: "Lỗi khi kiểm tra thông tin shipper",
                    error: checkErr.message
                });
            }

            if (checkResult.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Không tìm thấy shipper hoặc shipper không trong trạng thái chờ duyệt"
                });
            }

            // Cập nhật trạng thái shipper thành Active
            const updateSql = "UPDATE Shippers SET Status = 'Active' WHERE ShipperID = ?";
            db.query(updateSql, [shipperId], (updateErr, updateResult) => {
                if (updateErr) {
                    return res.status(500).json({
                        success: false,
                        message: "Lỗi khi cập nhật trạng thái shipper",
                        error: updateErr.message
                    });
                }

                res.json({
                    success: true,
                    message: "Đã duyệt shipper thành công",
                    data: {
                        shipperId: shipperId,
                        newStatus: 'Active',
                        affectedRows: updateResult.affectedRows
                    }
                });
            });
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi server",
            error: error.message
        });
    }
};
  module.exports = {
    
    getShipperDetails
    ,rejectRegisterShipper
    ,approveShipper
  };