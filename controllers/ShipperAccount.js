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

const updateShipper = async (req, res) => {
  try {
    const shipperId = req.params.id;
    const {
      TempPhoneNumber,
      TempEmail,
      TempHouseNumber,
      TempWard,
      TempDistrict,
      TempCity,
      TempBankName,
      TempBankAccountNumber,
      TempVehicleType,
      TempLicensePlate,
      TempRegistrationVehicle,
      TempExpiryVehicle,
      TempVehicleRegistrationImage,
      TempImageShipper
    } = req.body;

    // Prepare the update SQL query with only the fields that are provided
    let updateFields = [];
    let queryParams = [];

    // Add all temp fields that are provided
    if (TempPhoneNumber !== undefined) {
      updateFields.push('TempPhoneNumber = ?');
      queryParams.push(TempPhoneNumber);
    }

    if (TempEmail !== undefined) {
      updateFields.push('TempEmail = ?');
      queryParams.push(TempEmail);
    }

    if (TempHouseNumber !== undefined) {
      updateFields.push('TempHouseNumber = ?');
      queryParams.push(TempHouseNumber);
    }
    if (TempWard !== undefined) {
      updateFields.push('TempWard = ?');
      queryParams.push(TempWard);
    }

    if (TempDistrict !== undefined) {
      updateFields.push('TempDistrict = ?');
      queryParams.push(TempDistrict);
    }

    if (TempCity !== undefined) {
      updateFields.push('TempCity = ?');
      queryParams.push(TempCity);
    }

    if (TempBankName !== undefined) {
      updateFields.push('TempBankName = ?');
      queryParams.push(TempBankName);
    }

    if (TempBankAccountNumber !== undefined) {
      updateFields.push('TempBankAccountNumber = ?');
      queryParams.push(TempBankAccountNumber);
    }

    if (TempVehicleType !== undefined) {
      updateFields.push('TempVehicleType = ?');
      queryParams.push(TempVehicleType);
    }

    if (TempLicensePlate !== undefined) {
      updateFields.push('TempLicensePlate = ?');
      queryParams.push(TempLicensePlate);
    }

    if (TempRegistrationVehicle !== undefined) {
      updateFields.push('TempRegistrationVehicle = ?');
      queryParams.push(TempRegistrationVehicle);
    }

    if (TempExpiryVehicle !== undefined) {
      updateFields.push('TempExpiryVehicle = ?');
      queryParams.push(TempExpiryVehicle);
    }

    if (TempVehicleRegistrationImage !== undefined) {
      updateFields.push('TempVehicleRegistrationImage = ?');
      queryParams.push(TempVehicleRegistrationImage);
    }

    if (TempImageShipper !== undefined) {
      updateFields.push('TempImageShipper = ?');
      queryParams.push(TempImageShipper);
    }

    // Always update the status to PendingUpdate
    updateFields.push('Status = ?');
    queryParams.push('PendingUpdate');

    // Add shipperId to the query parameters
    queryParams.push(shipperId);

    // If there are no fields to update, return an error
    if (updateFields.length <= 1) { // Only has Status update
      return res.status(400).json({
        success: false,
        message: 'Không có thông tin nào được cập nhật'
      });
    }

    const updateQuery = `
      UPDATE Shippers 
      SET ${updateFields.join(', ')}
      WHERE ShipperID = ?
    `;

    db.query(updateQuery, queryParams, (err, result) => {
      if (err) {
        console.error('Error updating shipper data:', err);
        return res.status(500).json({
          success: false,
          message: 'Lỗi khi cập nhật thông tin shipper'
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy shipper để cập nhật'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Gửi yêu cầu cập nhật thông tin thành công. Đang chờ xét duyệt.'
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
  cancelShipperAccount,
  updateShipper
};
