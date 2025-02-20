const db = require('../config/DBConnect');

const getShipperAccount = async (req, res) => {
  try {
    const shipperId = req.params.id;
    if (!shipperId) {
        return res.status(400).json({
          success: false,
          message: 'ShipperID is required'
        });
      }
    const query = `
      SELECT 
        s.ShipperID,
        s.FullName,
        s.DateOfBirth,
        s.PhoneNumber,
        s.Email,
        s.CitizenID,
        s.VehicleType,
        s.LicensePlate,
        s.LicenseNumber,
        s.LicenseExpiryDate,
        s.ExpiryVehicle,
        s.HouseNumber,
        s.Ward,
        s.District,
        s.City,
        s.BankName,
        s.BankAccountNumber,
        s.DriverLicenseImage,
        s.VehicleRegistrationImage,
        s.ImageShipper,
        s.Status
      FROM Shippers s
      WHERE s.ShipperID = ?
    `;
      
    db.query(query, [shipperId], (err, results) => {
      if (err) {
        console.error('Error fetching shipper data:', err);
        return res.status(500).json({
          success: false,
          message: 'Lỗi khi lấy thông tin shipper'
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin shipper'
        });
      }

      res.status(200).json({
        success: true,
        data: results[0]
      });
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

const cancelShipperAccount = async (req, res) => {
    try {
      const shipperId = req.params.id;
      const { reason } = req.body;  // Keep the reason, and set the status to 'PendingCancel'
  
      const query = `
        UPDATE Shippers 
        SET Status = 'PendingCancel', CancelReason = ? 
        WHERE ShipperID = ?
      `;
  
      db.query(query, [reason, shipperId], (err, result) => {
        if (err) {
          console.error('Error canceling shipper account:', err);
          return res.status(500).json({
            success: false,
            message: 'Lỗi khi hủy tài khoản'
          });
        }
  
        if (result.affectedRows === 0) {
          return res.status(404).json({
            success: false,
            message: 'Không tìm thấy tài khoản shipper'
          });
        }
  
        res.status(200).json({
          success: true,
          message: 'Hủy tài khoản thành công, trạng thái đang chờ hủy'
        });
      });
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server'
      });
    }
  };

module.exports = {
  getShipperAccount,
  cancelShipperAccount
};