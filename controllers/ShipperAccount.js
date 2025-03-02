const db = require('../config/DBConnect');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config/jwtConfig');

// Middleware xác thực token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Không tìm thấy token'
        });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        console.error('Token Verification Error:', err);

        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token đã hết hạn'
            });
        }

        return res.status(403).json({
            success: false,
            message: 'Token không hợp lệ'
        });
    }
};

// Lấy thông tin tài khoản Shipper
const getShipperAccount = async (req, res) => {
    try {
        const shipperId = req.params.id;

        if (!shipperId) {
            return res.status(400).json({
                success: false,
                message: 'ShipperID là bắt buộc'
            });
        }

        const query = `
      SELECT 
  ShipperID,
  FullName,
  DateOfBirth,
  PhoneNumber,
  Email,
  CitizenID,
  VehicleType,
  LicensePlate,
  LicenseNumber,
  LicenseExpiryDate,
  ExpiryVehicle,
  HouseNumber,
  Ward,
  District,
  City,
  BankName,
  BankAccountNumber,
  DriverLicenseImage,
  VehicleRegistrationImage,
  ImageShipper,
  Status
FROM Shippers
WHERE ShipperID = ?
    `;

        db.query(query, [shipperId], (err, results) => {
            if (err) {
                console.error('Lỗi truy vấn dữ liệu shipper:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Lỗi khi lấy thông tin shipper',
                    error: err.message
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy thông tin shipper'
                });
            }

            const shipperData = { ...results[0] };
            delete shipperData.Password;

            res.status(200).json({
                success: true,
                data: shipperData
            });
        });
    } catch (error) {
        console.error('Lỗi server:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống',
            error: error.message
        });
    }
};

// Hủy tài khoản Shipper
const cancelShipperAccount = async (req, res) => {
    try {
        const shipperId = req.params.id;
        const { reason } = req.body;

        if (!shipperId) {
            return res.status(400).json({
                success: false,
                message: 'ShipperID là bắt buộc'
            });
        }

        // Lưu lý do hủy tài khoản
        const logReasonSql = `
      INSERT INTO ShipperAccountCancellations 
      (ShipperID, CancellationReason, CancellationDate) 
      VALUES (?, ?, NOW())
    `;

        // Cập nhật trạng thái tài khoản
        const updateStatusSql = `
      UPDATE Shippers 
      SET 
        Status = 'PendingCancel', 
        CancelReason = ?,
        CancelRequestDate = NOW()
      WHERE ShipperID = ?
    `;

        // Thực hiện trong transaction
        db.beginTransaction((err) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Lỗi khởi tạo giao dịch',
                    error: err.message
                });
            }

            // Lưu lý do hủy
            db.query(logReasonSql, [shipperId, reason], (err) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({
                            success: false,
                            message: 'Lỗi ghi nhận lý do hủy',
                            error: err.message
                        });
                    });
                }

                // Cập nhật trạng thái tài khoản
                db.query(updateStatusSql, [reason, shipperId], (err, result) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({
                                success: false,
                                message: 'Không thể cập nhật trạng thái tài khoản',
                                error: err.message
                            });
                        });
                    }

                    // Kiểm tra số dòng bị ảnh hưởng
                    if (result.affectedRows === 0) {
                        return db.rollback(() => {
                            res.status(404).json({
                                success: false,
                                message: 'Không tìm thấy tài khoản để hủy'
                            });
                        });
                    }

                    // Commit transaction
                    db.commit((err) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({
                                    success: false,
                                    message: 'Lỗi hoàn tất giao dịch',
                                    error: err.message
                                });
                            });
                        }

                        res.status(200).json({
                            success: true,
                            message: 'Yêu cầu hủy tài khoản đã được ghi nhận'
                        });
                    });
                });
            });
        });
    } catch (error) {
        console.error('Lỗi server:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống',
            error: error.message
        });
    }
};

module.exports = {
    authenticateToken,
    getShipperAccount,
    cancelShipperAccount
};