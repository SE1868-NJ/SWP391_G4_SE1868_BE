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
      console.log('Query Results:', results);

      const data = results.map(row => ({
        deliveryDate: row.deliveryDate,
        orderCount: row.orderCount,
        totalShippingFee: row.totalShippingFee || 0,
        totalExtraMoney: row.totalExtraMoney || 0,
        dailyTotal: Number(row.totalShippingFee || 0) + Number(row.totalExtraMoney || 0) // Không có bonus
      }));

      const totals = {
        totalOrderCount: data.reduce((sum, row) => sum + row.orderCount, 0),
        totalShippingFee: data.reduce((sum, row) => sum + Number(row.totalShippingFee), 0),
        totalExtraMoney: data.reduce((sum, row) => sum + Number(row.totalExtraMoney), 0),
        total: data.reduce((sum, row) => sum + row.dailyTotal, 0) // Tổng không có bonus
      };

      console.log('Processed Data:', data);
      console.log('Totals:', totals);
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
      SELECT Balance AS totalWallet
      FROM EWallet
      WHERE ShipperID = ?
    `;
    const queryParams = [shipperId];

    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.error('Error fetching total wallet data:', err);
        return res.status(500).json({ success: false, message: 'Lỗi khi lấy dữ liệu tổng ví' });
      }

      if (results.length === 0) {
        // Nếu không tìm thấy ví, trả về số dư = 0
        return res.status(200).json({
          success: true,
          data: {
            totalWallet: 0
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          totalWallet: Number(results[0].totalWallet) || 0
        }
      });
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
const depositToWallet = async (req, res) => {
  try {
    const shipperId = req.params.id;
    const { amount } = req.body;

    if (!shipperId || !amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ShipperID và số tiền hợp lệ là bắt buộc'
      });
    }

    // Kiểm tra xem shipper có tồn tại không
    const checkShipperQuery = `SELECT ShipperID FROM Shippers WHERE ShipperID = ?`;
    db.query(checkShipperQuery, [shipperId], (err, results) => {
      if (err) {
        console.error('Error checking shipper:', err);
        return res.status(500).json({
          success: false,
          message: 'Lỗi khi kiểm tra shipper'
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy shipper'
        });
      }

      // Cập nhật số dư ví
      const updateWalletQuery = `
        UPDATE EWallet
        SET Balance = Balance + ?
        WHERE ShipperID = ?
      `;
      db.query(updateWalletQuery, [amount, shipperId], (err, result) => {
        if (err) {
          console.error('Error updating wallet:', err);
          return res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật ví'
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            success: false,
            message: 'Không tìm thấy ví của shipper'
          });
        }

        // Lấy số dư mới sau khi cập nhật
        const getNewBalanceQuery = `SELECT Balance FROM EWallet WHERE ShipperID = ?`;
        db.query(getNewBalanceQuery, [shipperId], (err, results) => {
          if (err) {
            console.error('Error fetching new balance:', err);
            return res.status(500).json({
              success: false,
              message: 'Lỗi khi lấy số dư mới'
            });
          }

          res.status(200).json({
            success: true,
            data: {
              newBalance: results[0].Balance
            }
          });
        });
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
const withdrawFromWallet = async (req, res) => {
  try {
    const shipperId = req.params.id;
    const { amount } = req.body;

    if (!shipperId || !amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ShipperID và số tiền hợp lệ là bắt buộc'
      });
    }

    // Kiểm tra xem shipper có tồn tại không
    const checkShipperQuery = `SELECT ShipperID FROM Shippers WHERE ShipperID = ?`;
    db.query(checkShipperQuery, [shipperId], (err, results) => {
      if (err) {
        console.error('Error checking shipper:', err);
        return res.status(500).json({
          success: false,
          message: 'Lỗi khi kiểm tra shipper'
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy shipper'
        });
      }

      // Kiểm tra số dư ví có đủ không
      const checkBalanceQuery = `
        SELECT Balance FROM EWallet
        WHERE ShipperID = ?
      `;
      db.query(checkBalanceQuery, [shipperId], (err, balanceResults) => {
        if (err) {
          console.error('Error checking balance:', err);
          return res.status(500).json({
            success: false,
            message: 'Lỗi khi kiểm tra số dư ví'
          });
        }

        if (balanceResults.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Không tìm thấy ví của shipper'
          });
        }

        const currentBalance = parseFloat(balanceResults[0].Balance || 0);
        if (currentBalance < amount) {
          return res.status(400).json({
            success: false,
            message: 'Số dư trong ví không đủ để thực hiện giao dịch'
          });
        }

        // Cập nhật số dư ví
        const updateWalletQuery = `
          UPDATE EWallet
          SET Balance = Balance - ?
          WHERE ShipperID = ?
        `;
        db.query(updateWalletQuery, [amount, shipperId], (err, result) => {
          if (err) {
            console.error('Error updating wallet:', err);
            return res.status(500).json({
              success: false,
              message: 'Lỗi khi cập nhật ví'
            });
          }

          if (result.affectedRows === 0) {
            return res.status(404).json({
              success: false,
              message: 'Không tìm thấy ví của shipper'
            });
          }

          // Lấy số dư mới sau khi cập nhật
          const getNewBalanceQuery = `SELECT Balance FROM EWallet WHERE ShipperID = ?`;
          db.query(getNewBalanceQuery, [shipperId], (err, results) => {
            if (err) {
              console.error('Error fetching new balance:', err);
              return res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy số dư mới'
              });
            }

            // Thêm vào bảng lịch sử giao dịch (nếu có)
            // Code thêm lịch sử giao dịch ở đây nếu cần

            res.status(200).json({
              success: true,
              data: {
                newBalance: results[0].Balance
              }
            });
          });
        });
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
  updateShipper,
  getWalletData,
  getTotalWallet,
  depositToWallet,
  withdrawFromWallet 
};