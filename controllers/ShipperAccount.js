const db = require('../config/DBConnect');
const axios = require('axios');
const crypto = require('crypto');
const { createNotification } = require("./NotificationController"); 
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
        s.IDCardImage,
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
    const { reason } = req.body;  

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
    const { startDate, endDate, searchDate } = req.query;

    let query = `
      SELECT 
        OrderID,
        ActualDeliveryTime,
        ShippingFee,
        ExtraMoney
      FROM Orders
      WHERE ShipperID = ? AND OrderStatus = 'Delivered'
    `;
    let queryParams = [shipperId];

    if (searchDate) {
      query += ` AND DATE(ActualDeliveryTime) = ?`;
      queryParams.push(searchDate);
    } else {
      if (startDate && endDate) {
        query += ` AND DATE(ActualDeliveryTime) BETWEEN ? AND ?`;
        queryParams.push(startDate, endDate);
      } else if (startDate) {
        query += ` AND DATE(ActualDeliveryTime) >= ?`;
        queryParams.push(startDate);
      } else if (endDate) {
        query += ` AND DATE(ActualDeliveryTime) <= ?`;
        queryParams.push(endDate);
      }
    }
    query += ` ORDER BY ActualDeliveryTime DESC`;

    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ success: false, message: 'Lỗi khi lấy dữ liệu đơn hàng' });
      }

      const rawData = results.map((row) => ({
        orderId: row.OrderID,
        deliveryDate: row.ActualDeliveryTime.toISOString().split('T')[0],
        shippingFee: Number(row.ShippingFee) || 0,
        extraMoney: Number(row.ExtraMoney) || 0,
      }));

      console.log('Raw Data Sent:', rawData); 
      res.status(200).json({ success: true, data: rawData });
    });
  } catch (error) {
    console.error('Get Raw Wallet Error:', error);
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
    const { amount, isManualUpdate = false, orderId } = req.body;

    if (!shipperId || !amount || isNaN(amount) || amount <= 0) {
      await createNotification(shipperId, `Nạp tiền thất bại: Số tiền ${amount} VNĐ hoặc ShipperID không hợp lệ. Trạng thái: Đã hủy.`);
      return res.status(400).json({
        success: false,
        message: 'ShipperID và số tiền hợp lệ là bắt buộc',
      });
    }

    db.beginTransaction((err) => {
      if (err) {
        createNotification(shipperId, `Nạp tiền thất bại: Lỗi hệ thống khi bắt đầu giao dịch với ${amount} VNĐ. Trạng thái: Đã hủy.`)
          .catch((err) => console.error("Error creating notification:", err));
        console.error("Error starting transaction:", err);
        return res.status(500).json({
          success: false,
          message: "Lỗi khi bắt đầu giao dịch",
        });
      }

      const checkShipperQuery = `SELECT ShipperID FROM Shippers WHERE ShipperID = ?`;
      db.query(checkShipperQuery, [shipperId], (err, shipperResults) => {
        if (err || shipperResults.length === 0) {
          db.rollback(async () => {
            await createNotification(shipperId, `Nạp tiền thất bại: ${shipperResults.length === 0 ? 'Không tìm thấy shipper' : 'Lỗi kiểm tra shipper'} với ${amount} VNĐ. Trạng thái: Đã hủy.`);
            res.status(shipperResults.length === 0 ? 404 : 500).json({
              success: false,
              message: shipperResults.length === 0 ? 'Không tìm thấy shipper' : 'Lỗi khi kiểm tra shipper',
            });
          });
          return;
        }

        const checkWalletQuery = `SELECT Balance FROM EWallet WHERE ShipperID = ?`;
        db.query(checkWalletQuery, [shipperId], (err, walletResults) => {
          if (err) {
            db.rollback(async () => {
              await createNotification(shipperId, `Nạp tiền thất bại: Lỗi kiểm tra ví với ${amount} VNĐ. Trạng thái: Đã hủy.`);
              res.status(500).json({
                success: false,
                message: 'Lỗi khi kiểm tra ví',
              });
            });
            return;
          }

          const currentBalance = walletResults.length === 0 ? 0 : Number(walletResults[0].Balance);

          if (walletResults.length === 0) {
            const createWalletQuery = `INSERT INTO EWallet (ShipperID, Balance, LastUpdated) VALUES (?, 0, NOW())`;
            db.query(createWalletQuery, [shipperId], (err) => {
              if (err) {
                db.rollback(async () => {
                  await createNotification(shipperId, `Nạp tiền thất bại: Lỗi tạo ví mới với ${amount} VNĐ. Trạng thái: Đã hủy.`);
                  res.status(500).json({
                    success: false,
                    message: 'Lỗi khi tạo ví mới',
                  });
                });
                return;
              }
              proceedWithDeposit(currentBalance);
            });
          } else {
            proceedWithDeposit(currentBalance);
          }
        });

        const proceedWithDeposit = (currentBalance) => {
          if (!isManualUpdate) {
            const momoConfig = {
              accessKey: 'F8BBA842ECF85',
              secretKey: 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
              partnerCode: 'MOMO',
              redirectUrl: 'http://localhost:3000/finance-management',
              ipnUrl: 'http://localhost:4000/api/momo-ipn',
              lang: 'vi',
            };

            const orderId = `${momoConfig.partnerCode}${Date.now()}`;
            const requestId = orderId;
            const orderInfo = `Nạp ${amount} VNĐ - Shipper ${shipperId}`;
            const extraData = Buffer.from(JSON.stringify({ shipperId, depositAmount: amount })).toString('base64');
            const momoParams = {
              accessKey: momoConfig.accessKey,
              amount: amount.toString(),
              extraData,
              ipnUrl: momoConfig.ipnUrl,
              orderId,
              orderInfo,
              partnerCode: momoConfig.partnerCode,
              redirectUrl: momoConfig.redirectUrl,
              requestId,
              requestType: 'captureWallet',
            };

            const rawSignature = Object.entries(momoParams)
              .map(([key, value]) => `${key}=${value}`)
              .sort()
              .join('&');
            const signature = crypto.createHmac('sha256', momoConfig.secretKey).update(rawSignature).digest('hex');

            const requestBody = {
              ...momoParams,
              partnerName: 'ShipperApp',
              storeId: 'ShipperTestStore',
              lang: momoConfig.lang,
              signature,
            };

            axios
              .post('https://test-payment.momo.vn/v2/gateway/api/create', requestBody, {
                headers: { 'Content-Type': 'application/json' },
              })
              .then((response) => {
                if (response.data.resultCode === 0) {
                  res.status(200).json({ success: true, payUrl: response.data.payUrl, orderId });
                } else {
                  createNotification(shipperId, `Nạp tiền thất bại: Lỗi MoMo với ${amount} VNĐ. Trạng thái: Đã hủy.`)
                    .catch((err) => console.error("Error creating notification:", err));
                  res.status(400).json({
                    success: false,
                    message: response.data.message || 'Lỗi khi khởi tạo thanh toán MoMo',
                  });
                }
              })
              .catch(async (error) => {
                await createNotification(shipperId, `Nạp tiền thất bại: Lỗi gửi yêu cầu thanh toán MoMo với ${amount} VNĐ. Trạng thái: Đã hủy.`);
                res.status(500).json({
                  success: false,
                  message: 'Lỗi khi gửi yêu cầu thanh toán MoMo',
                });
              });
          } else {
            if (!orderId) {
              db.rollback(async () => {
                await createNotification(shipperId, `Nạp tiền thất bại: Thiếu orderId khi cập nhật thủ công với ${amount} VNĐ. Trạng thái: Đã hủy.`);
                res.status(400).json({
                  success: false,
                  message: 'orderId là bắt buộc khi cập nhật thủ công',
                });
              });
              return;
            }

            const referenceId = orderId;

            const checkTransactionQuery = `
              SELECT TransactionID FROM TransactionHistory 
              WHERE ShipperID = ? AND ReferenceID = ? FOR UPDATE
            `;
            db.query(checkTransactionQuery, [shipperId, referenceId], (err, transactionResults) => {
              if (err) {
                db.rollback(async () => {
                  await createNotification(shipperId, `Nạp tiền thất bại: Lỗi kiểm tra giao dịch với ${amount} VNĐ. Trạng thái: Đã hủy.`);
                  res.status(500).json({
                    success: false,
                    message: 'Lỗi khi kiểm tra giao dịch',
                  });
                });
                return;
              }

              if (transactionResults.length > 0) {
                db.commit((err) => {
                  if (err) {
                    db.rollback(async () => {
                      await createNotification(shipperId, `Nạp tiền thất bại: Lỗi commit giao dịch với ${amount} VNĐ. Trạng thái: Đã hủy.`);
                      res.status(500).json({
                        success: false,
                        message: 'Lỗi khi commit giao dịch',
                      });
                    });
                    return;
                  }
                  res.status(200).json({
                    success: true,
                    data: { newBalance: currentBalance, transactionId: transactionResults[0].TransactionID },
                    message: 'Giao dịch đã được xử lý trước đó',
                  });
                });
                return;
              }

              const newBalance = currentBalance + Number(amount);
              const updateWalletQuery = `UPDATE EWallet SET Balance = ?, LastUpdated = NOW() WHERE ShipperID = ?`;
              const addTransactionQuery = `
                INSERT INTO TransactionHistory 
                (ShipperID, Type, Amount, Status, Description, PaymentMethod, ReferenceID)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE TransactionID = TransactionID
              `;
              const description = `Nạp tiền vào ví`;
              const paymentMethod = 'momo';
              db.query(updateWalletQuery, [newBalance, shipperId], (err) => {
                if (err) {
                  db.rollback(async () => {
                    await createNotification(shipperId, `Nạp tiền thất bại: Lỗi cập nhật ví với ${amount} VNĐ. Trạng thái: Đã hủy.`);
                    res.status(500).json({
                      success: false,
                      message: 'Lỗi khi cập nhật ví',
                    });
                  });
                  return;
                }

                db.query(
                  addTransactionQuery,
                  [shipperId, 'deposit', amount, 'success', description, paymentMethod, referenceId],
                  (err, result) => {
                    if (err) {
                      db.rollback(async () => {
                        await createNotification(shipperId, `Nạp tiền thất bại: Lỗi ghi lịch sử giao dịch với ${amount} VNĐ. Trạng thái: Đã hủy.`);
                        res.status(500).json({
                          success: false,
                          message: 'Lỗi khi thêm lịch sử giao dịch',
                        });
                      });
                      return;
                    }

                    db.commit(async (err) => {
                      if (err) {
                        db.rollback(async () => {
                          await createNotification(shipperId, `Nạp tiền thất bại: Lỗi hoàn tất giao dịch với ${amount} VNĐ. Trạng thái: Đã hủy.`);
                          res.status(500).json({
                            success: false,
                            message: 'Lỗi khi hoàn tất giao dịch',
                          });
                        });
                        return;
                      }

                      await createNotification(shipperId, `Nạp tiền thành công: ${amount} VNĐ đã được thêm vào ví. Trạng thái: Hoàn tất.`);
                      res.status(200).json({
                        success: true,
                        data: { newBalance, transactionId: referenceId },
                      });
                    });
                  }
                );
              });
            });
          }
        };
      });
    });
  } catch (error) {
    console.error('Server error:', error);
    await createNotification(shipperId, `Nạp tiền thất bại: Lỗi server với ${amount} VNĐ. Trạng thái: Đã hủy.`);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
    });
  }
};
const withdrawFromWallet = async (req, res) => {
  try {
    const shipperId = req.params.id;
    const { amount, paymentMethod } = req.body;

    if (!shipperId || !amount || isNaN(amount) || amount <= 0) {
      await createNotification(shipperId, `Rút tiền thất bại: Số tiền ${amount} VNĐ hoặc ShipperID không hợp lệ. Trạng thái: Đã hủy.`);
      return res.status(400).json({
        success: false,
        message: "ShipperID và số tiền hợp lệ là bắt buộc",
      })
    }

    // Bắt đầu transaction để đảm bảo tính toàn vẹn dữ liệu
    db.beginTransaction((err) => {
      if (err) {
        createNotification(shipperId, `Rút tiền thất bại: Lỗi hệ thống khi bắt đầu giao dịch với ${amount} VNĐ. Trạng thái: Đã hủy.`)
           .catch((err) => console.error("Error creating notification:", err));
         console.error("Error starting transaction:", err);
        return res.status(500).json({
          success: false,
          message: "Lỗi khi bắt đầu giao dịch",
        })
      }

      // Kiểm tra xem shipper có tồn tại không
      const checkShipperQuery = `SELECT ShipperID FROM Shippers WHERE ShipperID = ?`
      db.query(checkShipperQuery, [shipperId], (err, results) => {
        if (err) {
          return db.rollback(() => {
            console.error("Error checking shipper:", err)
            res.status(500).json({
              success: false,
              message: "Lỗi khi kiểm tra shipper",
            })
          })
        }

        if (err || results.length === 0) {
          db.rollback(async () => {
            await createNotification(shipperId, `Rút tiền thất bại: ${results.length === 0 ? 'Không tìm thấy shipper' : 'Lỗi kiểm tra shipper'} với ${amount} VNĐ. Trạng thái: Đã hủy.`);
            res.status(results.length === 0 ? 404 : 500).json({
              success: false,
              message: results.length === 0 ? "Không tìm thấy shipper" : "Lỗi khi kiểm tra shipper",
            })
          })
          return;
        }

        // Kiểm tra số dư ví có đủ không
        const checkBalanceQuery = `
          SELECT Balance FROM EWallet
          WHERE ShipperID = ?
        `
        db.query(checkBalanceQuery, [shipperId], (err, balanceResults) => {
          if (err) {
            db.rollback(async () => {
              await createNotification(shipperId, `Rút tiền thất bại: Lỗi kiểm tra số dư với ${amount} VNĐ. Trạng thái: Đã hủy.`);
              res.status(500).json({
                success: false,
                message: "Lỗi khi kiểm tra số dư ví",
              })
            })
            return;
          }

          if (balanceResults.length === 0) {
            db.rollback(async () => {
              await createNotification(shipperId, `Rút tiền thất bại: Không tìm thấy ví với ${amount} VNĐ. Trạng thái: Đã hủy.`);
              res.status(404).json({
                success: false,
                message: "Không tìm thấy ví của shipper",
              })
            })
            return;
          }

          const currentBalance = Number.parseFloat(balanceResults[0].Balance || 0)
          if (currentBalance < amount) {
            db.rollback(async () => {
              await createNotification(shipperId, `Rút tiền thất bại: Số dư không đủ với ${amount} VNĐ. Trạng thái: Đã hủy.`);
              res.status(400).json({
                success: false,
                message: "Số dư trong ví không đủ để thực hiện giao dịch",
              })
            })
            return;
          }

          // Cập nhật số dư ví
          const updateWalletQuery = `
            UPDATE EWallet
            SET Balance = Balance - ?, LastUpdated = NOW()
            WHERE ShipperID = ?
          `
          db.query(updateWalletQuery, [amount, shipperId], (err, result) => {
            if (err) {
              db.rollback(async () => {
                await createNotification(shipperId, `Rút tiền thất bại: Lỗi cập nhật ví với ${amount} VNĐ. Trạng thái: Đã hủy.`);
                res.status(500).json({
                  success: false,
                  message: "Lỗi khi cập nhật ví",
                })
              })
              return;
            }

            if (result.affectedRows === 0) {
              db.rollback(async () => {
                await createNotification(shipperId, `Rút tiền thất bại: Không tìm thấy ví để cập nhật với ${amount} VNĐ. Trạng thái: Đã hủy.`);
                res.status(404).json({
                  success: false,
                  message: "Không tìm thấy ví của shipper",
                })
              })
              return;
            }

            const referenceId = `WD${Date.now()}${Math.floor(Math.random() * 1000)}`

            const addTransactionQuery = `
              INSERT INTO TransactionHistory 
              (ShipperID, Type, Amount, Status, Description, PaymentMethod, ReferenceID)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `

            const paymentMethodValue = paymentMethod || "bank"
            const description = "Rút tiền từ ví"

            db.query(
              addTransactionQuery,
              [shipperId, "withdraw", amount, "success", description, paymentMethodValue, referenceId],
              (err, transactionResult) => {
                if (err) {
                  db.rollback(async () => {
                    await createNotification(shipperId, `Rút tiền thất bại: Lỗi ghi lịch sử giao dịch với ${amount} VNĐ. Trạng thái: Đã hủy.`);
                    res.status(500).json({
                      success: false,
                      message: "Lỗi khi thêm lịch sử giao dịch",
                    })
                  })
                  return;
                }

                // Lấy số dư mới sau khi cập nhật
                const getNewBalanceQuery = `SELECT Balance FROM EWallet WHERE ShipperID = ?`
                db.query(getNewBalanceQuery, [shipperId], (err, results) => {
                  if (err) {
                    db.rollback(async () => {
                      await createNotification(shipperId, `Rút tiền thất bại: Lỗi lấy số dư mới với ${amount} VNĐ. Trạng thái: Đã hủy.`);
                      res.status(500).json({
                        success: false,
                        message: "Lỗi khi lấy số dư mới",
                      })
                    })
                    return;
                  }

                  // Commit transaction
                  db.commit(async (err) => {
                    if (err) {
                      db.rollback(async () => {
                        await createNotification(shipperId, `Rút tiền thất bại: Lỗi hoàn tất giao dịch với ${amount} VNĐ. Trạng thái: Đã hủy.`);
                        res.status(500).json({
                          success: false,
                          message: "Lỗi khi hoàn tất giao dịch",
                        })
                      })
                      return;
                    }

                    // Trả về kết quả thành công
                    await createNotification(shipperId, `Rút tiền thành công: ${amount} VNĐ đã được rút khỏi ví. Trạng thái: Hoàn tất.`);
                    res.status(200).json({
                      success: true,
                      data: {
                        newBalance: results[0].Balance,
                        transactionId: referenceId,
                      },
                    })
                  })
                })
              },
            )
          })
        })
      })
    })
  } catch (error) {
    console.error("Server error:", error);
    await createNotification(shipperId, `Rút tiền thất bại: Lỗi server với ${amount} VNĐ. Trạng thái: Đã hủy.`);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    })
  }
}
const getTransactionHistory = async (req, res) => {
  try {
    const shipperId = req.params.id;
    const { searchDate } = req.query;
    if (req.user && req.user.id !== Number.parseInt(shipperId) && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền truy cập dữ liệu này",
      });
    }

    if (!shipperId) {
      return res.status(400).json({
        success: false,
        message: "ShipperID is required",
      });
    }

    // Lấy số dư hiện tại từ EWallet
    const getBalanceQuery = `SELECT Balance FROM EWallet WHERE ShipperID = ?`;
    const [balanceResults] = await new Promise((resolve, reject) => {
      db.query(getBalanceQuery, [shipperId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    const currentBalance = balanceResults ? Number(balanceResults.Balance) : 0;

    // Lấy lịch sử giao dịch
    let query = `
      SELECT 
        TransactionID as id,
        Type as type,
        Amount as amount,
        Status as status,
        Description as description,
        TransactionDate as date,
        PaymentMethod as paymentMethod,
        ReferenceID as referenceId
      FROM TransactionHistory
      WHERE ShipperID = ?
    `;
    let queryParams = [shipperId];

    if (searchDate) {
      query += ` AND DATE(TransactionDate) = ?`;
      queryParams.push(searchDate);
    }
    query += ` ORDER BY TransactionDate DESC LIMIT 50`;
    const transactions = await new Promise((resolve, reject) => {
      db.query(query, queryParams, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Tính toán số dư sau mỗi giao dịch
    let runningBalance = currentBalance;
    const transactionsWithBalance = transactions.map((transaction) => {
      const amount = Number(transaction.amount);
      const balanceAfterTransaction = 
        transaction.type === "deposit" 
          ? runningBalance - amount 
          : runningBalance + amount; 
      
      runningBalance = 
        transaction.type === "deposit" 
          ? runningBalance - amount 
          : runningBalance + amount;

      return {
        ...transaction,
        balanceAfterTransaction: transaction.type === "deposit" 
          ? balanceAfterTransaction + amount 
          : balanceAfterTransaction - amount,
      };
    }).reverse(); // Đảo ngược để tính từ giao dịch cũ nhất đến mới nhất, sau đó trả về thứ tự gốc

    return res.status(200).json({
      success: true,
      data: {
        transactions: transactionsWithBalance.reverse(), // Đảo lại để giữ thứ tự mới nhất trước
        currentBalance, // Trả về số dư hiện tại
      },
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};
const getOrderDetailsByDate = async (req, res) => {
  try {
    const shipperId = req.params.id;
    const { deliveryDate } = req.query;

    console.log('Received request - shipperId:', shipperId, 'deliveryDate:', deliveryDate);

    if (!shipperId || !deliveryDate) {
      console.log('Missing shipperId or deliveryDate');
      return res.status(400).json({
        success: false,
        message: 'ShipperID và ngày giao hàng là bắt buộc',
      });
    }

    const query = `
      SELECT 
        OrderID,
        OrderStatus,
        ShippingFee,
        ExtraMoney,
        ActualDeliveryTime,
        DeliveryAddress
      FROM Orders
      WHERE ShipperID = ? 
        AND DATE(ActualDeliveryTime) = ?
        AND OrderStatus = 'Delivered'
      ORDER BY ActualDeliveryTime DESC
    `;
    const queryParams = [shipperId, deliveryDate];

    console.log('Executing query:', query, 'with params:', queryParams);

    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: 'Lỗi khi lấy chi tiết đơn hàng',
          error: err.message,
        });
      }

      console.log('Query results:', results);

      const orderDetails = results.map((row) => ({
        orderId: row.OrderID,
        status: row.OrderStatus,
        shippingFee: row.ShippingFee || 0,
        extraMoney: row.ExtraMoney || 0,
        deliveryTime: row.ActualDeliveryTime,
        deliveryAddress: row.DeliveryAddress,
      }));

      res.status(200).json({
        success: true,
        data: orderDetails,
      });
    });
  } catch (error) {
    console.error('Unexpected server error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message,
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
  withdrawFromWallet,
  getOrderDetailsByDate,
  getTransactionHistory
};