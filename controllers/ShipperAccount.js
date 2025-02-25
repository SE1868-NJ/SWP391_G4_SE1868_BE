import db from "../config/DBConnect.js";
const getShipperById = (req, res) => {
    const shipperId = req.params.shipperId;
    const sql = "SELECT * FROM shippers WHERE ShipperID = ?";

    db.query(sql, [shipperId], (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Lỗi truy vấn cơ sở dữ liệu" });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy thông tin shipper" });
        }

        res.json(results[0]);
    });
};

const updateShipper = (req, res) => {
    const shipperId = req.params.shipperId;
    const {
        FullName,
        PhoneNumber,
        Email,
        DateOfBirth,
        Address,
        BankAccountNumber,
        VehicleDetails
    } = req.body;

    console.log("Dữ liệu nhận được:", req.body);
    console.log("ID Shipper:", shipperId);

    const sql = `
      UPDATE Shippers 
      SET 
        FullName = ?, 
        PhoneNumber = ?, 
        Email = ?, 
        DateOfBirth = ?, 
        Address = ?, 
        BankAccountNumber = ?, 
        VehicleDetails = ?
      WHERE ShipperID = ?
    `;

    const values = [
        FullName,
        PhoneNumber,
        Email,
        DateOfBirth,
        Address,
        BankAccountNumber,
        VehicleDetails,
        shipperId
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Lỗi cơ sở dữ liệu:", err);
            return res.status(500).json({
                message: "Lỗi cập nhật thông tin",
                error: err.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Không tìm thấy shipper để cập nhật"
            });
        }

        res.json({
            message: "Cập nhật thành công",
            affectedRows: result.affectedRows
        });
    });
};
 const deleteShipper = (req, res) => {
    const shipperId = req.params.shipperId;
    const { reason } = req.body;

    console.log(`Xóa tài khoản Shipper ID: ${shipperId}, Lý do: ${reason}`);

    // Tạo bảng lưu lý do hủy tài khoản (tuỳ chọn)
    const logReasonSql = `
      INSERT INTO ShipperAccountCancellations 
      (ShipperID, CancellationReason, CancellationDate) 
      VALUES (?, ?, NOW())
    `;

    // Xóa tài khoản
    const deleteShipperSql = 'DELETE FROM Shippers WHERE ShipperID = ?';

    // Thực hiện xóa trong transaction
    db.beginTransaction((err) => {
        if (err) {
            return res.status(500).json({
                message: "Lỗi bắt đầu giao dịch",
                error: err.message
            });
        }

        // Lưu lý do hủy
        db.query(logReasonSql, [shipperId, reason], (err) => {
            if (err) {
                return db.rollback(() => {
                    res.status(500).json({
                        message: "Lỗi ghi nhận lý do hủy",
                        error: err.message
                    });
                });
            }

            // Thực hiện xóa tài khoản
            db.query(deleteShipperSql, [shipperId], (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({
                            message: "Không thể xóa tài khoản",
                            error: err.message
                        });
                    });
                }

                // Commit transaction
                db.commit((err) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({
                                message: "Lỗi hoàn tất giao dịch",
                                error: err.message
                            });
                        });
                    }

                    // Kiểm tra số dòng bị ảnh hưởng
                    if (result.affectedRows === 0) {
                        return res.status(404).json({
                            message: "Không tìm thấy tài khoản để xóa"
                        });
                    }

                    res.json({
                        message: "Xóa tài khoản thành công"
                    });
                });
            });
        });
    });
};

export { getShipperById, updateShipper, deleteShipper };