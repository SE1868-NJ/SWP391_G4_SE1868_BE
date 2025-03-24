const db = require("../config/DBConnect");
const { createOrderNotification } = require("./NotificationController");

const getOrdersPending = (req, res) => {
  try {
    if (req.query.page && req.query.limit) {
      let page = req.query.page;
      let limit = req.query.limit;
      let search = req.query.search || '';

      let offset = (page - 1) * limit;
      const countQuery = `
        SELECT COUNT(*) AS totalRows 
        FROM swp_shipper.orders o 
        JOIN swp_shipper.customers c 
        ON o.CustomerID = c.CustomerID
        WHERE o.OrderStatus = "Pending"
        AND (c.FullName LIKE ? OR c.PhoneNumber LIKE ? OR c.Email LIKE ?)
      `;

      db.query(countQuery, [`%${search}%`, `%${search}%`, `%${search}%`], (err, countResults) => {
        if (err) {
          return res.status(500).send(err.message);
        }

        const totalRows = countResults[0].totalRows;
        const totalPages = Math.ceil(totalRows / limit);

        const sql = `
          SELECT o.*, c.FullName, c.PhoneNumber, c.Email 
          FROM swp_shipper.orders o 
          JOIN swp_shipper.customers c 
          ON o.CustomerID = c.CustomerID
          WHERE o.OrderStatus = "Pending"
          AND (c.FullName LIKE ? OR c.PhoneNumber LIKE ? OR c.Email LIKE ?)
          ORDER BY o.EstimatedDeliveryTime
          LIMIT ? OFFSET ?
        `;

        db.query(sql, [`%${search}%`, `%${search}%`, `%${search}%`, Number(limit), offset], (err, results) => {
          if (err) {
            return res.status(500).send(err.message);
          }
          res.json({
            totalRows: totalRows,
            totalPages: totalPages,
            orders: results
          });
        });
      });
    } else {
      const sql = `
        SELECT o.*, c.FullName, c.PhoneNumber, c.Email 
        FROM swp_shipper.orders o 
        JOIN swp_shipper.customers c 
        ON o.CustomerID = c.CustomerID
        WHERE o.OrderStatus = "Pending"
      `;
      db.query(sql, (err, results) => {
        if (err) {
          return res.status(500).send(err.message);
        }
        res.json({ orders: results });
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal server error.");
  }
};

const getMyDeliveryOrders = (req, res) => {
  try {
    if (req.query.page && req.query.limit) {
      let page = req.query.page;
      let limit = req.query.limit;
      let search = req.query.search || '';
      let shipperID = req.query.shipperId;

      let offset = (page - 1) * limit;
      const countQuery = `
        SELECT COUNT(*) AS totalRows 
        FROM swp_shipper.orders o 
        JOIN swp_shipper.customers c 
        ON o.CustomerID = c.CustomerID
        WHERE o.OrderStatus = "InProgress" 
        AND o.ShipperID = ?
        AND (c.FullName LIKE ? OR c.PhoneNumber LIKE ? OR c.Email LIKE ?)
      `;

      db.query(countQuery, [shipperID, `%${search}%`, `%${search}%`, `%${search}%`], (err, countResults) => {
        if (err) {
          return res.status(500).send(err.message);
        }

        const totalRows = countResults[0].totalRows;
        const totalPages = Math.ceil(totalRows / limit);

        const sql = `
          SELECT o.*, c.FullName, c.PhoneNumber, c.Email 
          FROM swp_shipper.orders o 
          JOIN swp_shipper.customers c 
          ON o.CustomerID = c.CustomerID
          WHERE o.OrderStatus = "InProgress" 
          AND o.ShipperID = ?
          AND (c.FullName LIKE ? OR c.PhoneNumber LIKE ? OR c.Email LIKE ?)
          ORDER BY o.EstimatedDeliveryTime
          LIMIT ? OFFSET ?
        `;

        db.query(sql, [shipperID, `%${search}%`, `%${search}%`, `%${search}%`, Number(limit), offset], (err, results) => {
          if (err) {
            return res.status(500).send(err.message);
          }
          res.json({
            totalRows: totalRows,
            totalPages: totalPages,
            orders: results
          });
        });
      });
    } else {
      const sql = `
        SELECT o.*, c.FullName, c.PhoneNumber, c.Email 
        FROM swp_shipper.orders o 
        JOIN swp_shipper.customers c 
        ON o.CustomerID = c.CustomerID
        WHERE o.ShipperID = ?
        AND o.OrderStatus = "InProgress"
      `;
      db.query(sql, [shipperID], (err, results) => {
        if (err) {
          return res.status(500).send(err.message);
        }
        res.json({ orders: results });
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal server error.");
  }
};

const getHistoryDeliveryOrders = (req, res) => {
  try {
    if (req.query.page && req.query.limit) {
      let page = req.query.page;
      let limit = req.query.limit;
      let search = req.query.search || '';
      let status = req.query.status;
      let shipperID = req.query.shipperId;

      let offset = (page - 1) * limit;
      let countQuery = `
        SELECT COUNT(*) AS totalRows 
        FROM swp_shipper.orders o 
        JOIN swp_shipper.customers c 
        ON o.CustomerID = c.CustomerID
        WHERE o.ShipperID = ?
        AND (c.FullName LIKE ? OR c.PhoneNumber LIKE ? OR c.Email LIKE ?)
      `;
      let sql = `
        SELECT o.*, c.FullName, c.PhoneNumber, c.Email 
        FROM swp_shipper.orders o 
        JOIN swp_shipper.customers c 
        ON o.CustomerID = c.CustomerID
        WHERE o.ShipperID = ?
        AND (c.FullName LIKE ? OR c.PhoneNumber LIKE ? OR c.Email LIKE ?)
      `;

<<<<<<< HEAD
            if(status !== "All"){
                countQuery += ` ( o.OrderStatus = "${status}" )`
            }else {
                countQuery += ` ( o.OrderStatus = "Cancelled" or o.OrderStatus = "Delivered" ) `
            }
             
            countQuery +=` And ( o.ShipperID = ${shipperID})
                                And ( c.Fullname LIKE '%${search}%'
                                OR c.PhoneNumber LIKE '%${search}%'
                                OR c.Email LIKE '%${search}%')
            `;
            db.query(countQuery, (err, countResults) => {
                if (err) {
                    return res.status(500).send(err.message);
                }
                
                const totalRows = countResults[0].totalRows;
                const totalPages = Math.ceil(totalRows / limit);
                
                let sql = `SELECT * 
                            FROM swp_shipper.orders o 
                            JOIN swp_shipper.customers c 
                            ON o.CustomerID = c.CustomerID
                            WHERE`;
                              if(status !== "All"){
                                sql += ` ( o.OrderStatus = "${status}" )`
                            }else {
                                sql += ` ( o.OrderStatus = "Cancelled" or o.OrderStatus = "Delivered" )`
                            }
                            sql +=  ` And ( o.ShipperID = ${shipperID})
                                And  ( c.Fullname LIKE '%${search}%'
                                OR c.PhoneNumber LIKE '%${search}%'
                                OR c.Email LIKE '%${search}%')
                            ORDER BY EstimatedDeliveryTime
                            LIMIT ${limit} OFFSET ${offset}`;
=======
      if (status !== "All") {
        countQuery += ` AND o.OrderStatus = ?`;
        sql += ` AND o.OrderStatus = ?`;
      } else {
        countQuery += ` AND o.OrderStatus IN ("Cancelled", "Delivered")`;
        sql += ` AND o.OrderStatus IN ("Cancelled", "Delivered")`;
      }
>>>>>>> 2ae69c51fd7352e33d617b16f807aeb1e333ffc6

      countQuery += ` ORDER BY o.EstimatedDeliveryTime`;
      sql += ` ORDER BY o.EstimatedDeliveryTime LIMIT ? OFFSET ?`;

      const params = status !== "All" 
        ? [shipperID, `%${search}%`, `%${search}%`, `%${search}%`, status]
        : [shipperID, `%${search}%`, `%${search}%`, `%${search}%`];

      db.query(countQuery, params, (err, countResults) => {
        if (err) {
          return res.status(500).send(err.message);
        }

        const totalRows = countResults[0].totalRows;
        const totalPages = Math.ceil(totalRows / limit);

        db.query(sql, [...params, Number(limit), offset], (err, results) => {
          if (err) {
            return res.status(500).send(err.message);
          }
          res.json({
            totalRows: totalRows,
            totalPages: totalPages,
            orders: results
          });
        });
      });
    } else {
      const sql = `
        SELECT o.*, c.FullName, c.PhoneNumber, c.Email 
        FROM swp_shipper.orders o 
        JOIN swp_shipper.customers c 
        ON o.CustomerID = c.CustomerID
        WHERE o.ShipperID = ?
      `;
      db.query(sql, [shipperID], (err, results) => {
        if (err) {
          return res.status(500).send(err.message);
        }
        res.json({ orders: results });
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal server error.");
  }
};

const confirmDeliveryOrder = (req, res) => {
  const { OrderID, Status } = req.body;

  db.beginTransaction(async (transactionError) => {
    if (transactionError) {
      return res.status(500).json({ 
        message: "Lỗi khởi tạo giao dịch",
        error: transactionError.message 
      });
    }

    try {
      // Lấy thông tin đơn hàng chi tiết
      const [orderResults] = await db.promise().query(
        'SELECT * FROM swp_shipper.orders WHERE OrderID = ?', 
        [OrderID]
      );

      if (orderResults.length === 0) {
        return res.status(404).json({ 
          message: "Không tìm thấy đơn hàng",
          orderId: OrderID 
        });
      }

      const order = orderResults[0];
      const { ShipperID, Deposit, ShippingFee } = order;

      const updateOrderQuery = `
        UPDATE swp_shipper.orders
        SET OrderStatus = ?, 
            ActualDeliveryTime = CURRENT_TIMESTAMP
        WHERE OrderID = ?
      `;

      const [updateResult] = await db.promise().query(updateOrderQuery, [Status, OrderID]);

      if (updateResult.affectedRows === 0) {
        return res.status(404).json({ 
          message: "Không tìm thấy đơn hàng",
          orderId: OrderID 
        });
      }

      if (Status === 'Delivered') {
        // Cập nhật ví và hoàn tiền cọc
        const updateWalletQuery = `
          UPDATE swp_shipper.EWallet
          SET Balance = Balance + ?
          WHERE ShipperID = ?
        `;

        const totalAmount = Number(Deposit || 0) + Number(ShippingFee || 0);

        const [walletUpdateResult] = await db.promise().query(updateWalletQuery, [totalAmount, ShipperID]);

        // Tạo thông báo
        await createOrderNotification(ShipperID, OrderID, Status);

        return res.status(200).json({ 
          message: "Xác nhận đơn hàng thành công",
          deposit: Deposit,
          shippingFee: ShippingFee,
          totalAdded: totalAmount
        });
      } else if (Status === 'Cancelled') {
        // Tạo thông báo cho trạng thái bị hủy
        await createOrderNotification(ShipperID, OrderID, Status);

        return res.status(200).json({ 
          message: "Đơn hàng đã bị hủy",
          orderId: OrderID
        });
      }
    } catch (error) {
      console.error('Lỗi xử lý đơn hàng:', error);
      return res.status(500).json({ 
        message: "Lỗi xử lý đơn hàng",
        error: error.message 
      });
    }
  });
};

const changeStatusOrder = (req, res) => {
  try {
    const { OrderID, Status } = req.body;
    const sql = `
      UPDATE swp_shipper.orders
      SET OrderStatus = ?
      WHERE OrderID = ?
    `;
    db.query(sql, [Status, OrderID], (err, results) => {
      if (err) {
        return res.status(500).send(err.message);
      }
      res.json({ message: "Status updated successfully!" });
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal server error.");
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const orderID = req.params.id;
    const sqlOrder = `SELECT * FROM swp_shipper.orders WHERE OrderID = ?`;
    const sqlShop = `SELECT * FROM swp_shipper.shops WHERE ShopID = ?`;
    const sqlCustomer = `SELECT CustomerID, FullName, PhoneNumber FROM swp_shipper.customers WHERE CustomerID = ?`;
    const sqlProducts = `SELECT * FROM swp_shipper.products WHERE OrderID = ?`;

    const [orderResults] = await db.promise().query(sqlOrder, [orderID]);
    if (orderResults.length === 0) {
      return res.status(404).send("Order not found.");
    }
    const order = orderResults[0];

    const [shopResults] = await db.promise().query(sqlShop, [order.ShopID]);
    if (shopResults.length === 0) {
      return res.status(404).send("Shop not found.");
    }
    const shop = shopResults[0];

    const [customerResults] = await db.promise().query(sqlCustomer, [order.CustomerID]);
    if (customerResults.length === 0) {
      return res.status(404).send("Customer not found.");
    }
    const customer = customerResults[0];

    const [productsResults] = await db.promise().query(sqlProducts, [orderID]);
    if (productsResults.length === 0) {
      return res.status(404).send("Products not found.");
    }

    res.json({
      message: "Order, shop, and customer details retrieved successfully!",
      order,
      shop,
      customer,
      products: productsResults
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal server error.");
  }
};

const pickOrder = (req, res) => {
  console.log('Full Request Body:', req.body);

  const { OrderID, ShipperID, Deposit, EstimatedDeliveryTime } = req.body;

  if (!OrderID || !ShipperID || !Deposit || !EstimatedDeliveryTime) {
    console.error('Invalid Input:', { OrderID, ShipperID, Deposit, EstimatedDeliveryTime });
    return res.status(400).json({ 
      message: "Thiếu thông tin bắt buộc",
      receivedData: req.body
    });
  }

  db.beginTransaction((transactionError) => {
    if (transactionError) {
      console.error('Transaction Start Error:', transactionError);
      return res.status(500).json({ 
        message: "Lỗi khởi tạo giao dịch",
        error: transactionError.message 
      });
    }

    const balanceQuery = `
      SELECT COALESCE(Balance, 0) as balance 
      FROM swp_shipper.EWallet 
      WHERE ShipperID = ?
    `;

    db.query(balanceQuery, [ShipperID], (balanceError, balanceResults) => {
      if (balanceError) {
        return db.rollback(() => {
          console.error('Balance Check Error:', balanceError);
          return res.status(500).json({ 
            message: "Lỗi kiểm tra số dư",
            error: balanceError.message 
          });
        });
      }

      if (balanceResults.length === 0) {
        return db.rollback(() => {
          return res.status(404).json({ 
            message: "Không tìm thấy ví",
            shipperID: ShipperID 
          });
        });
      }

      const currentBalance = Number(balanceResults[0].balance);
      const depositAmount = Number(Deposit);

      console.log('Balance Comparison:', { currentBalance, depositAmount, isEnough: currentBalance >= depositAmount });

      if (depositAmount > currentBalance) {
        return db.rollback(() => {
          return res.status(400).json({ 
            message: "Số dư không đủ",
            currentBalance,
            requiredDeposit: depositAmount 
          });
        });
      }

      const updateOrderQuery = `
        UPDATE swp_shipper.orders 
        SET OrderStatus = 'InProgress', 
            ShipperID = ?, 
            EstimatedDeliveryTime = ? 
        WHERE OrderID = ? AND OrderStatus = 'Pending'
      `;

      db.query(updateOrderQuery, [ShipperID, EstimatedDeliveryTime, OrderID], (updateOrderError, updateResult) => {
        if (updateOrderError) {
          return db.rollback(() => {
            console.error('Update Order Error:', updateOrderError);
            return res.status(500).json({ 
              message: "Lỗi cập nhật đơn hàng",
              error: updateOrderError.message 
            });
          });
        }

        if (updateResult.affectedRows === 0) {
          return db.rollback(() => {
            return res.status(404).json({ 
              message: "Không tìm thấy đơn hàng hoặc đơn hàng không ở trạng thái Pending",
              orderId: OrderID 
            });
          });
        }

        const updateBalanceQuery = `
          UPDATE swp_shipper.EWallet 
          SET Balance = Balance - ? 
          WHERE ShipperID = ?
        `;

        db.query(updateBalanceQuery, [depositAmount, ShipperID], (updateBalanceError) => {
          if (updateBalanceError) {
            return db.rollback(() => {
              console.error('Update Balance Error:', updateBalanceError);
              return res.status(500).json({ 
                message: "Lỗi cập nhật số dư",
                error: updateBalanceError.message 
              });
            });
          }

          const createNotificationQuery = `
            INSERT INTO swp_shipper.notifications 
            (shipperid, message, timestamp, unread) 
            VALUES (?, ?, NOW(), 1)
          `;

          db.query(createNotificationQuery, [ShipperID, `Bạn đã nhận đơn hàng ${OrderID} thành công`], (notificationError) => {
            if (notificationError) {
              return db.rollback(() => {
                console.error('Notification Error:', notificationError);
                return res.status(500).json({ 
                  message: "Lỗi tạo thông báo",
                  error: notificationError.message 
                });
              });
            }

            db.commit((commitError) => {
              if (commitError) {
                return db.rollback(() => {
                  console.error('Commit Error:', commitError);
                  return res.status(500).json({ 
                    message: "Lỗi hoàn tất giao dịch",
                    error: commitError.message 
                  });
                });
              }

              return res.status(200).json({ 
                message: "Đã nhận đơn hàng thành công",
                orderId: OrderID 
              });
            });
          });
        });
      });
    });
  });
};

const getAllMyDeliveryOrders = (req, res) => {
  const UserID = req.params.id;
  console.log(UserID);
  try {
    const sql = `
      SELECT o.*, c.FullName, c.PhoneNumber, c.Email 
      FROM swp_shipper.orders o
      JOIN swp_shipper.customers c 
      ON o.CustomerID = c.CustomerID
      WHERE o.ShipperID = ?
    `;
    db.query(sql, [UserID], (err, results) => {
      if (err) {
        return res.status(500).send(err.message);
      }
      res.json({ orders: results });
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal server error.");
  }
};

const updateShippingFee = (req, res) => {
  const { OrderID, ShippingFee } = req.body;

  if (!OrderID || !ShippingFee) {
    return res.status(400).json({ message: "Thiếu OrderID hoặc ShippingFee" });
  }

  const updateQuery = `
    UPDATE swp_shipper.orders
    SET ShippingFee = ?
    WHERE OrderID = ?
  `;

  db.query(updateQuery, [ShippingFee, OrderID], (err, result) => {
    if (err) {
      console.error('Lỗi khi cập nhật ShippingFee:', err);
      return res.status(500).json({ message: "Lỗi cập nhật ShippingFee", error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    res.status(200).json({ message: "Cập nhật ShippingFee thành công" });
  });
};

module.exports = { 
  getOrdersPending, 
  getMyDeliveryOrders, 
  getHistoryDeliveryOrders, 
  changeStatusOrder, 
  getOrderDetails, 
  pickOrder, 
  confirmDeliveryOrder, 
  getAllMyDeliveryOrders,
  updateShippingFee
};