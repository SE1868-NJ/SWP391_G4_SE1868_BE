const db = require('../config/DBConnect');
const ExcelJS = require('exceljs');
const { v4: uuidv4 } = require('uuid');
// API lấy danh sách bonus và summary
const getAllBonuses = (req, res) => {
  const { month, ratingFilter } = req.query;

  let query = `
    SELECT 
      b.*,
      s.FullName ,
      (SELECT SUM(CASE WHEN r.Rating = 5 THEN 1 ELSE 0 END) 
       FROM ratings r 
       WHERE r.ShipperID = b.ShipperID 
       AND r.IsLatest = 1 
       AND DATE_FORMAT(r.CreatedAt, '%Y-%m') = ?) AS Rating5Count,
      (SELECT SUM(CASE WHEN r.Rating = 4 THEN 1 ELSE 0 END) 
       FROM ratings r 
       WHERE r.ShipperID = b.ShipperID 
       AND r.IsLatest = 1 
       AND DATE_FORMAT(r.CreatedAt, '%Y-%m') = ?) AS Rating4Count,
      b.status as Status
    FROM Bonus b
    JOIN shippers s ON b.ShipperID = s.ShipperID
    WHERE DATE_FORMAT(b.Month, '%Y-%m') = ?
  `;

  const queryParams = [month, month, month];

  if (ratingFilter && ratingFilter !== 'all') {
    if (ratingFilter === 'high') query += ' AND b.AvgRating >= 4.5';
    if (ratingFilter === 'medium') query += ' AND b.AvgRating BETWEEN 3.5 AND 4.4';
    if (ratingFilter === 'low') query += ' AND b.AvgRating < 3.5';
  }

  db.query(query, queryParams, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Chuyển đổi trường số về kiểu số để phía frontend xử lý dễ hơn
    result = result.map(item => ({
      ...item,
      Rating5Count: parseInt(item.Rating5Count || 0),
      Rating4Count: parseInt(item.Rating4Count || 0),
      TotalOrders: parseInt(item.TotalOrders),
      AvgRating: parseFloat(item.AvgRating),
      BonusAmount: parseInt(item.BonusAmount)
    }));

    const summary = {
      totalBonus: result.reduce((sum, item) => sum + item.BonusAmount, 0).toString(),
      shipperCount: result.length,
      avgRating: Number((result.reduce((sum, item) => sum + item.AvgRating, 0) / (result.length || 1)).toFixed(2))
    };

    res.json({
      data: result,
      summary
    });
  });
};

// API tìm kiếm bonus
const searchBonuses = (req, res) => {
  const { searchTerm, month, ratingFilter } = req.query;

  let query = `
    SELECT 
      b.*,
      s.FullName ,
      (SELECT SUM(CASE WHEN r.Rating = 5 THEN 1 ELSE 0 END) 
       FROM ratings r 
       WHERE r.ShipperID = b.ShipperID 
       AND r.IsLatest = 1 
       AND DATE_FORMAT(r.CreatedAt, '%Y-%m') = ?) AS Rating5Count,
      (SELECT SUM(CASE WHEN r.Rating = 4 THEN 1 ELSE 0 END) 
       FROM ratings r 
       WHERE r.ShipperID = b.ShipperID 
       AND r.IsLatest = 1 
       AND DATE_FORMAT(r.CreatedAt, '%Y-%m') = ?) AS Rating4Count,
      b.status as Status
    FROM Bonus b
    JOIN shippers s ON b.ShipperID = s.ShipperID
    WHERE (s.FullName LIKE ? OR b.ShipperID LIKE ?)
    AND DATE_FORMAT(b.Month, '%Y-%m') = ?
  `;

  const searchValue = `%${searchTerm}%`;
  const queryParams = [month, month, searchValue, searchValue, month];

  if (ratingFilter && ratingFilter !== 'all') {
    if (ratingFilter === 'high') query += ' AND b.AvgRating >= 4.5';
    if (ratingFilter === 'medium') query += ' AND b.AvgRating BETWEEN 3.5 AND 4.4';
    if (ratingFilter === 'low') query += ' AND b.AvgRating < 3.5';
  }

  db.query(query, queryParams, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Chuyển đổi trường số về kiểu số để phía frontend xử lý dễ hơn
    result = result.map(item => ({
      ...item,
      Rating5Count: parseInt(item.Rating5Count || 0),
      Rating4Count: parseInt(item.Rating4Count || 0),
      TotalOrders: parseInt(item.TotalOrders),
      AvgRating: parseFloat(item.AvgRating),
      BonusAmount: parseInt(item.BonusAmount)
    }));

    // Thêm summary khi tìm kiếm để hiển thị trên frontend
    const summary = {
      totalBonus: result.reduce((sum, item) => sum + item.BonusAmount, 0).toString(),
      shipperCount: result.length,
      avgRating: Number((result.reduce((sum, item) => sum + item.AvgRating, 0) / (result.length || 1)).toFixed(2))
    };

    res.json({
      data: result,
      summary
    });
  });
};

// API tính toán bonus


// API lấy cài đặt bonus
const getBonusSettings = (req, res) => {
  const query = 'SELECT * FROM bonus_settings LIMIT 1';

  db.query(query, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const settings = result[0];
    res.json({
      rating5Threshold: parseFloat(settings.Rating5Threshold),
      rating5Bonus: parseFloat(settings.Rating5Bonus),
      rating4And5Threshold: parseFloat(settings.Rating4And5Threshold),
      rating4And5Bonus: parseFloat(settings.Rating4And5Bonus),
      otherBonus: parseFloat(settings.OtherBonus)
    });
  });
};

// API cập nhật cài đặt bonus
const updateBonusSettings = (req, res) => {
  const { rating5Threshold, rating5Bonus, rating4And5Threshold, rating4And5Bonus, otherBonus } = req.body;

  const query = `
    UPDATE bonus_settings 
    SET Rating5Threshold = ?, Rating5Bonus = ?, 
        Rating4And5Threshold = ?, Rating4And5Bonus = ?, 
        OtherBonus = ?,
        LastUpdated = CURRENT_TIMESTAMP
    WHERE SettingID = 1
  `;

  const queryParams = [
    parseFloat(rating5Threshold),
    parseFloat(rating5Bonus),
    parseFloat(rating4And5Threshold),
    parseFloat(rating4And5Bonus),
    parseFloat(otherBonus)
  ];

  db.query(query, queryParams, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Cập nhật cài đặt thành công' });
  });
};

// Thêm API xuất Excel
const exportBonusExcel = async (req, res) => {
  const { month, ratingFilter } = req.body.params || req.body;
  try {
    // Construct the query based on the rating filter
    let query = `
      SELECT 
        b.ShipperID, 
        s.FullName, 
        b.TotalOrders, 
        b.AvgRating, 
        (SELECT SUM(CASE WHEN r.Rating = 5 THEN 1 ELSE 0 END) 
         FROM ratings r 
         WHERE r.ShipperID = b.ShipperID 
         AND r.IsLatest = 1 
         AND DATE_FORMAT(r.CreatedAt, '%Y-%m') = ?) AS Rating5Count,
        (SELECT SUM(CASE WHEN r.Rating = 4 THEN 1 ELSE 0 END) 
         FROM ratings r 
         WHERE r.ShipperID = b.ShipperID 
         AND r.IsLatest = 1 
         AND DATE_FORMAT(r.CreatedAt, '%Y-%m') = ?) AS Rating4Count,
        b.BonusAmount 
      FROM Bonus b
      JOIN shippers s ON b.ShipperID = s.ShipperID
      WHERE DATE_FORMAT(b.Month, '%Y-%m') = ?
    `;
    const queryParams = [month, month, month];

    // Add rating filter if specified
    if (ratingFilter === 'high') {
      query += ' AND b.AvgRating >= 4.5';
    } else if (ratingFilter === 'medium') {
      query += ' AND b.AvgRating >= 3.5 AND b.AvgRating < 4.5';
    } else if (ratingFilter === 'low') {
      query += ' AND b.AvgRating < 3.5';
    }

    // Execute the query
    const [shipperData] = await db.promise().query(query, queryParams);

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Shipper Bonus ${month}`);

    // Define columns
    worksheet.columns = [
      { header: 'Shipper ID', key: 'ShipperID', width: 15 },
      { header: 'Tên Shipper', key: 'FullName', width: 25 },
      { header: 'Số Đơn Hàng', key: 'TotalOrders', width: 15 },
      { header: 'Đánh Giá TB', key: 'AvgRating', width: 15 },
      { header: 'Đánh Giá 5 Sao', key: 'Rating5Count', width: 20 },
      { header: 'Đánh Giá 4 Sao', key: 'Rating4Count', width: 20 },
      { header: 'Tiền Thưởng (VNĐ)', key: 'BonusAmount', width: 20 }
    ];

    // Add styling to header
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4472C4' }
    };

    // Add data rows with formatted calculations
    shipperData.forEach(shipper => {
      worksheet.addRow({
        ShipperID: shipper.ShipperID,
        FullName: shipper.FullName,
        TotalOrders: shipper.TotalOrders,
        AvgRating: Number(shipper.AvgRating).toFixed(2),
        Rating5Count: `${shipper.Rating5Count} (${((shipper.Rating5Count / shipper.TotalOrders) * 100).toFixed(0)}%)`,
        Rating4Count: `${shipper.Rating4Count} (${((shipper.Rating4Count / shipper.TotalOrders) * 100).toFixed(0)}%)`,
        BonusAmount: Number(shipper.BonusAmount).toLocaleString()
      });
    });

    // Add summary row
    const totalBonus = shipperData.reduce((sum, shipper) => sum + shipper.BonusAmount, 0);
    const avgRating = shipperData.reduce((sum, shipper) => sum + shipper.AvgRating, 0) / shipperData.length;

    worksheet.addRow({}); // Empty row
    worksheet.addRow({
      FullName: 'TỔNG CỘNG',
      TotalOrders: shipperData.reduce((sum, shipper) => sum + shipper.TotalOrders, 0),
      AvgRating: avgRating.toFixed(2),
      BonusAmount: Number(totalBonus).toLocaleString()
    });
    worksheet.getRow(worksheet.rowCount).font = { bold: true };

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Shipper_Bonus_${month}.xlsx`);

    // Write to buffer and send
    const buffer = await workbook.xlsx.writeBuffer();
    res.send(buffer);

  } catch (error) {
    console.error('Error exporting Excel:', error);
    res.status(500).json({ 
      error: 'Không thể xuất file Excel',
      details: error.message 
    });
  }
};
const processBonusPayment = (req, res) => {
  const { ShipperID, BonusAmount, Month } = req.body;

  // Start a transaction
  db.beginTransaction((err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // 1. Check EWallet balance
    db.query(
      'SELECT Balance FROM EWallet WHERE ShipperID = ?', 
      [ShipperID],
      (err, walletCheck) => {
        if (err) {
          return db.rollback(() => {
            res.status(500).json({ error: err.message });
          });
        }

        if (!walletCheck.length) {
          return db.rollback(() => {
            res.status(404).json({ error: 'Ví điện tử không tồn tại' });
          });
        }

        // 2. Update EWallet balance
        db.query(
          `UPDATE EWallet 
           SET Balance = Balance + ?, 
               LastUpdated = NOW()
           WHERE ShipperID = ?`, 
          [BonusAmount, ShipperID],
          (err) => {
            if (err) {
              return db.rollback(() => {
                res.status(500).json({ error: err.message });
              });
            }

            // 3. Generate unique transaction ID
            const transactionId = uuidv4();

            // 4. Insert transaction history
            db.query(
              `INSERT INTO TransactionHistory 
               (ShipperID, Type, Amount, Status, Description, PaymentMethod, ReferenceID)
               VALUES (?, ?, ?, ?, ?, ?, ?)`, 
              [
                ShipperID, 
                'deposit', 
                BonusAmount, 
                'SUCCESS', 
                `Tiền thưởng tháng ${Month}`, 
                'DIRECT_TRANSFER', 
                transactionId
              ],
              (err) => {
                if (err) {
                  return db.rollback(() => {
                    res.status(500).json({ error: err.message });
                  });
                }

                // 5. Update Bonus table to mark as paid
                db.query(
                  `UPDATE Bonus 
                   SET Status = 'PAID', 
                       PaidAt = NOW() 
                   WHERE ShipperID = ? AND DATE_FORMAT(Month, '%Y-%m') = ?`, 
                  [ShipperID, Month],
                  (err) => {
                    if (err) {
                      return db.rollback(() => {
                        res.status(500).json({ error: err.message });
                      });
                    }

                    // Commit the transaction
                    db.commit((err) => {
                      if (err) {
                        return db.rollback(() => {
                          res.status(500).json({ error: err.message });
                        });
                      }

                      res.json({ 
                        message: 'Thanh toán thưởng thành công', 
                        transactionId: transactionId 
                      });
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  });
};
const calculateBonusForShipper = (req, res) => {
  const { month } = req.body;

  // Lấy cài đặt bonus hiện tại
  const getSettingsQuery = 'SELECT * FROM bonus_settings LIMIT 1';
  
  db.query(getSettingsQuery, (settingsErr, settingsResult) => {
    if (settingsErr) {
      return res.status(500).json({ error: settingsErr.message });
    }

    const settings = settingsResult[0];

    // Truy vấn để lấy thông tin shipper và rating
    const shipperDataQuery = `
      SELECT 
        b.ShipperID, 
        b.TotalOrders,
        (SELECT SUM(CASE WHEN r.Rating = 5 THEN 1 ELSE 0 END) 
         FROM ratings r 
         WHERE r.ShipperID = b.ShipperID 
         AND r.IsLatest = 1 
         AND DATE_FORMAT(r.CreatedAt, '%Y-%m') = ?) AS Rating5Count,
        (SELECT SUM(CASE WHEN r.Rating = 4 THEN 1 ELSE 0 END) 
         FROM ratings r 
         WHERE r.ShipperID = b.ShipperID 
         AND r.IsLatest = 1 
         AND DATE_FORMAT(r.CreatedAt, '%Y-%m') = ?) AS Rating4Count,
        b.AvgRating
      FROM Bonus b
      WHERE DATE_FORMAT(b.Month, '%Y-%m') = ?
    `;

    db.query(shipperDataQuery, [month, month, month], (dataErr, shipperData) => {
      if (dataErr) {
        return res.status(500).json({ error: dataErr.message });
      }

      // Bắt đầu transaction để đảm bảo tính toàn vẹn dữ liệu
      db.beginTransaction((transactionErr) => {
        if (transactionErr) {
          return res.status(500).json({ error: transactionErr.message });
        }

        // Mảng để lưu các câu truy vấn update
        const updateQueries = [];

        shipperData.forEach(shipper => {
          const rating5Percentage = (shipper.Rating5Count / shipper.TotalOrders) * 100;
          const rating4And5Percentage = ((shipper.Rating5Count + shipper.Rating4Count) / shipper.TotalOrders) * 100;

          let bonusAmount = settings.OtherBonus; // Mức thưởng mặc định

          // Tính toán bonus dựa trên các ngưỡng
          if (rating5Percentage >= settings.Rating5Threshold) {
            bonusAmount = settings.Rating5Bonus * shipper.TotalOrders;
          } else if (rating4And5Percentage >= settings.Rating4And5Threshold) {
            bonusAmount = settings.Rating4And5Bonus * shipper.TotalOrders;
          }

          // Thêm câu truy vấn update vào mảng
          updateQueries.push(
            new Promise((resolve, reject) => {
              db.query(
                `UPDATE Bonus 
                 SET BonusAmount = ?
                 WHERE ShipperID = ? AND DATE_FORMAT(Month, '%Y-%m') = ?`, 
                [bonusAmount, shipper.ShipperID, month],
                (updateErr) => {
                  if (updateErr) reject(updateErr);
                  else resolve();
                }
              );
            })
          );
        });

        // Thực thi tất cả các câu truy vấn update
        Promise.all(updateQueries)
          .then(() => {
            db.commit((commitErr) => {
              if (commitErr) {
                return db.rollback(() => {
                  res.status(500).json({ error: commitErr.message });
                });
              }
              res.json({ 
                message: 'Đã tính lại tiền thưởng cho tất cả Shipper',
                updatedCount: shipperData.length
              });
            });
          })
          .catch((updateErr) => {
            db.rollback(() => {
              res.status(500).json({ error: updateErr.message });
            });
          });
      });
    });
  });
};
module.exports = {
  processBonusPayment,
  getAllBonuses,
  searchBonuses,
  getBonusSettings,
  updateBonusSettings,
  exportBonusExcel,
  calculateBonusForShipper

};