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
const getWalletData = async (req, res) => {
  try {
    const shipperId = req.params.id;
    const { week } = req.query;
    console.log('ShipperID:', shipperId, 'Filter Week:', week);

    if (!shipperId) {
      return res.status(400).json({ success: false, message: 'ShipperID is required' });
    }

    let query = `
      SELECT 
        DATE(ActualDeliveryTime) AS deliveryDate,
        COUNT(*) AS orderCount,
        SUM(ShippingFee) AS totalShippingFee,
        SUM(ExtraMoney) AS totalExtraMoney
      FROM Orders
      WHERE ShipperID = ? AND OrderStatus = 'Delivered'
    `;
    let queryParams = [shipperId];

    if (week) {
      const [year, weekNum] = week.split('-W');
      query += ` AND YEAR(ActualDeliveryTime) = ? AND WEEK(ActualDeliveryTime, 1) = ?`;
      queryParams.push(year, parseInt(weekNum));
    }

    query += ` GROUP BY DATE(ActualDeliveryTime) ORDER BY deliveryDate DESC`;

    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.error('Error fetching wallet data:', err);
        return res.status(500).json({ success: false, message: 'Lỗi khi lấy dữ liệu ví' });
      }
      console.log('Query Results:', results); // Kiểm tra kết quả từ DB

      const data = results.map(row => {
        const orderCount = row.orderCount;
        let bonus = 0;
        const bonusPerMilestone = 2000;
        if (orderCount >= 20) bonus = bonusPerMilestone * 20;
        else if (orderCount >= 15) bonus = bonusPerMilestone * 15;
        else if (orderCount >= 10) bonus = bonusPerMilestone * 10;
        else if (orderCount >= 5) bonus = bonusPerMilestone * 5;
        const dailyTotal = Number(row.totalShippingFee || 0) + Number(row.totalExtraMoney || 0) + bonus;
        return {
          deliveryDate: row.deliveryDate,
          orderCount,
          totalShippingFee: row.totalShippingFee || 0,
          totalExtraMoney: row.totalExtraMoney || 0,
          bonus,
          dailyTotal
        };
      });

      const totals = {
        totalOrderCount: data.reduce((sum, row) => sum + row.orderCount, 0),
        totalShippingFee: data.reduce((sum, row) => sum + Number(row.totalShippingFee), 0),
        totalExtraMoney: data.reduce((sum, row) => sum + Number(row.totalExtraMoney), 0),
        totalBonus: data.reduce((sum, row) => sum + row.bonus, 0)
      };

      console.log('Processed Data:', data); // Kiểm tra dữ liệu sau khi xử lý
      console.log('Totals:', totals); // Kiểm tra totals
      res.status(200).json({
        success: true,
        data: { dailyData: data, totals }
      });
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
const getTotalWallet = async (req, res) => {
  try {
    const shipperId = req.params.id;

    if (!shipperId) {
      return res.status(400).json({ success: false, message: 'ShipperID is required' });
    }

    const query = `
      SELECT 
        SUM(ShippingFee) AS totalShippingFee,
        SUM(ExtraMoney) AS totalExtraMoney,
        COUNT(*) AS orderCount
      FROM Orders
      WHERE ShipperID = ? AND OrderStatus = 'Delivered'
    `;
    const queryParams = [shipperId];

    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.error('Error fetching total wallet data:', err);
        return res.status(500).json({ success: false, message: 'Lỗi khi lấy dữ liệu tổng ví' });
      }

      const result = results[0];
      const orderCount = result.orderCount || 0;
      let totalBonus = 0;
      const bonusPerMilestone = 2000;

      db.query(`
        SELECT COUNT(*) AS dailyOrderCount
        FROM Orders
        WHERE ShipperID = ? AND OrderStatus = 'Delivered'
        GROUP BY DATE(ActualDeliveryTime)
      `, [shipperId], (err, dailyResults) => {
        if (err) {
          console.error('Error fetching daily order counts:', err);
          return res.status(500).json({ success: false, message: 'Lỗi khi tính bonus' });
        }

        dailyResults.forEach(row => {
          const dailyCount = row.dailyOrderCount;
          if (dailyCount >= 20) totalBonus += bonusPerMilestone * 20;
          else if (dailyCount >= 15) totalBonus += bonusPerMilestone * 15;
          else if (dailyCount >= 10) totalBonus += bonusPerMilestone * 10;
          else if (dailyCount >= 5) totalBonus += bonusPerMilestone * 5;
        });

        const totalWallet = (Number(result.totalShippingFee) || 0) + (Number(result.totalExtraMoney) || 0) + totalBonus;

        res.status(200).json({
          success: true,
          data: {
            totalWallet: totalWallet,
            totalShippingFee: Number(result.totalShippingFee) || 0,
            totalExtraMoney: Number(result.totalExtraMoney) || 0,
            totalBonus: totalBonus
          }
        });
      });
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
module.exports = {
  getShipperAccount,
  cancelShipperAccount,
  updateShipper,
  getWalletData,
  getTotalWallet
};
