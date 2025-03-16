const db = require("../config/DBConnect");
const { createOrderNotification } = require("./NotificationController");


const getOrdersPending = (req, res) => {
    try {
        if (req.query.page && req.query.limit) {
            let page = req.query.page;
            let limit = req.query.limit;
            let search = req.query.search;


            let offset = (page - 1) * limit;
            const countQuery = `
            SELECT COUNT(*) AS totalRows 
            FROM swp_shipper.orders o 
            JOIN swp_shipper.customers c 
            ON o.CustomerID = c.CustomerID
            WHERE ( o.OrderStatus = "Pending")
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

                const sql = `SELECT * 
                            FROM swp_shipper.orders o 
                            JOIN swp_shipper.customers c 
                            ON o.CustomerID = c.CustomerID
                            WHERE ( o.OrderStatus = "Pending")
                                And  ( c.Fullname LIKE '%${search}%'
                                OR c.PhoneNumber LIKE '%${search}%'
                                OR c.Email LIKE '%${search}%')
                            ORDER BY EstimatedDeliveryTime
                            LIMIT ${limit} OFFSET ${offset}`;

                db.query(sql, (err, results) => {
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
            const sql = `SELECT *
            FROM swp_shipper.orders o 
            join swp_shipper.customers c on o.CustomerID = c.CustomerID`;
            db.query(sql, (err, results) => {
                if (err) {
                    return res.status(500).send(err.message);
                }
                res.json({
                    orders: results
                });
            });
        }
    } catch (error) {
        console.log(error);
    }
};

const getMyDeliveryOrders = (req, res) => {
    try {
        if (req.query.page && req.query.limit) {
            let page = req.query.page;
            let limit = req.query.limit;
            let search = req.query.search;
            let shipperID = req.query.shipperId;


            let offset = (page - 1) * limit;
            const countQuery = `
            SELECT COUNT(*) AS totalRows 
            FROM swp_shipper.orders o 
            JOIN swp_shipper.customers c 
            ON o.CustomerID = c.CustomerID
            WHERE ( o.OrderStatus = "InProgress")
                                And ( o.ShipperID = ${shipperID})
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

                const sql = `SELECT * 
                            FROM swp_shipper.orders o 
                            JOIN swp_shipper.customers c 
                            ON o.CustomerID = c.CustomerID
                            WHERE ( o.OrderStatus = "InProgress")
                                And ( o.ShipperID = ${shipperID})
                                And  ( c.Fullname LIKE '%${search}%'
                                OR c.PhoneNumber LIKE '%${search}%'
                                OR c.Email LIKE '%${search}%')
                            ORDER BY EstimatedDeliveryTime
                            LIMIT ${limit} OFFSET ${offset}`;

                db.query(sql, (err, results) => {
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
            const sql = `SELECT *
            FROM swp_shipper.orders o 
            WHERE o.ShipperID = ${shipperID}
            join swp_shipper.customers c on o.CustomerID = c.CustomerID`;
            db.query(sql, (err, results) => {
                if (err) {
                    return res.status(500).send(err.message);
                }
                res.json({
                    orders: results
                });
            });
        }
    } catch (error) {
        console.log(error);
    }
};

const getHistoryDeliveryOrders = (req, res) => {
    try {
        if (req.query.page && req.query.limit) {
            let page = req.query.page;
            let limit = req.query.limit;
            let search = req.query.search;
            let status = req.query.status;
            let shipperID = req.query.shipperId;

            console.log(status);

            let offset = (page - 1) * limit;
            let countQuery = `
            SELECT COUNT(*) AS totalRows 
            FROM swp_shipper.orders o 
            JOIN swp_shipper.customers c 
            ON o.CustomerID = c.CustomerID
            WHERE `;

            if (status !== "All") {
                countQuery += ` ( o.OrderStatus = "${status}" )`
            } else {
                countQuery += ` ( o.OrderStatus = "Cancelled" or o.OrderStatus = "Delivered" ) `
            }

            countQuery += ` And ( o.ShipperID = ${shipperID})
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
                if (status !== "All") {
                    sql += ` ( o.OrderStatus = "${status}" )`
                } else {
                    sql += ` ( o.OrderStatus = "Cancelled" or o.OrderStatus = "Delivered" )`
                }
                sql += ` And ( o.ShipperID = ${shipperID})
                                And  ( c.Fullname LIKE '%${search}%'
                                OR c.PhoneNumber LIKE '%${search}%'
                                OR c.Email LIKE '%${search}%')
                            ORDER BY EstimatedDeliveryTime
                            LIMIT ${limit} OFFSET ${offset}`;
                console.log(sql);

                db.query(sql, (err, results) => {
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
            const sql = `SELECT *
            FROM swp_shipper.orders o 
            WHERE o.ShipperID = ${shipperID}
            join swp_shipper.customers c on o.CustomerID = c.CustomerID`;
            db.query(sql, (err, results) => {
                if (err) {
                    return res.status(500).send(err.message);
                }
                res.json({
                    orders: results
                });
            });
        }
    } catch (error) {
        console.log(error);
    }
};

const confirmDeliveryOrder = (req, res) => {
    const { OrderID, Status, FailureReason } = req.body;
    
    console.log('Received confirm order data:', { OrderID, Status, FailureReason });

    // Bắt đầu transaction
    db.beginTransaction((transactionError) => {
        if (transactionError) {
            return res.status(500).json({ 
                message: "Lỗi khởi tạo giao dịch",
                error: transactionError.message 
            });
        }

        // Truy vấn lấy thông tin đơn hàng
        const orderQuery = `
            SELECT o.*, e.Balance as CurrentBalance 
            FROM swp_shipper.orders o
            JOIN swp_shipper.EWallet e ON o.ShipperID = e.ShipperID
            WHERE o.OrderID = ?
        `;
        
        db.query(orderQuery, [OrderID], (orderErr, orderResults) => {
            if (orderErr) {
                return db.rollback(() => {
                    return res.status(500).json({ 
                        message: "Lỗi truy vấn đơn hàng",
                        error: orderErr.message 
                    });
                });
            }

            if (orderResults.length === 0) {
                return db.rollback(() => {
                    return res.status(404).json({ 
                        message: "Không tìm thấy đơn hàng" 
                    });
                });
            }

            const order = orderResults[0];
            const shipperId = order.ShipperID;
            
            // Chuyển đổi giá trị sang số, làm tròn 2 chữ số thập phân
            const deposit = parseFloat(order.Deposit || 0).toFixed(2);
            const shippingFee = parseFloat(order.ShippingFee || 0).toFixed(2);
            const currentBalance = parseFloat(order.CurrentBalance || 0).toFixed(2);

            // Kiểm tra và log các giá trị
            console.log('Order Details:', {
                shipperId,
                deposit,
                shippingFee,
                currentBalance
            });

            // Cập nhật trạng thái đơn hàng
            const updateOrderQuery = `
                UPDATE swp_shipper.orders
                SET 
                    OrderStatus = ?,
                    ActualDeliveryTime = CURRENT_TIMESTAMP
                WHERE OrderID = ?
            `;

            db.query(updateOrderQuery, [Status, OrderID], (updateErr) => {
                if (updateErr) {
                    return db.rollback(() => {
                        return res.status(500).json({ 
                            message: "Lỗi cập nhật trạng thái đơn hàng",
                            error: updateErr.message 
                        });
                    });
                }

                // Xử lý hoàn tiền
                if (Status === 'Delivered') {
                    // Giao hàng thành công: hoàn tiền cọc và cộng phí ship
                    const updateWalletQuery = `
                        UPDATE swp_shipper.EWallet
                        SET Balance = Balance + ?
                        WHERE ShipperID = ?
                    `;

                    const totalAmount = Number(deposit) + Number(shippingFee);
                    
                    db.query(updateWalletQuery, [totalAmount, shipperId], (walletUpdateErr) => {
                        if (walletUpdateErr) {
                            return db.rollback(() => {
                                return res.status(500).json({ 
                                    message: "Lỗi cập nhật ví",
                                    error: walletUpdateErr.message 
                                });
                            });
                        }

                        // Commit transaction
                        db.commit((commitErr) => {
                            if (commitErr) {
                                return db.rollback(() => {
                                    return res.status(500).json({ 
                                        message: "Lỗi hoàn tất giao dịch",
                                        error: commitErr.message 
                                    });
                                });
                            }

                            return res.status(200).json({ 
                                message: "Xác nhận đơn hàng thành công",
                                deposit: Number(deposit),
                                shippingFee: Number(shippingFee),
                                totalAdded: totalAmount
                            });
                        });
                    });
                } 
                else if (Status === 'Cancelled') {
                    // Xử lý khi giao hàng thất bại
                    if (FailureReason === 'shipper_error') {
                        // Lỗi do shipper: không hoàn tiền
                        db.commit((commitErr) => {
                            if (commitErr) {
                                return db.rollback(() => {
                                    return res.status(500).json({ 
                                        message: "Lỗi hoàn tất giao dịch",
                                        error: commitErr.message 
                                    });
                                });
                            }

                            return res.status(200).json({ 
                                message: "Xác nhận đơn hàng thất bại do shipper",
                                deposit: 0,
                                shippingFee: 0
                            });
                        });
                    } 
                    else {
                        // Lỗi do khách hàng: hoàn tiền cọc
                        const updateWalletQuery = `
                            UPDATE swp_shipper.EWallet
                            SET Balance = Balance + ?
                            WHERE ShipperID = ?
                        `;

                        db.query(updateWalletQuery, [Number(deposit), shipperId], (walletUpdateErr) => {
                            if (walletUpdateErr) {
                                return db.rollback(() => {
                                    return res.status(500).json({ 
                                        message: "Lỗi cập nhật ví",
                                        error: walletUpdateErr.message 
                                    });
                                });
                            }

                            // Commit transaction
                            db.commit((commitErr) => {
                                if (commitErr) {
                                    return db.rollback(() => {
                                        return res.status(500).json({ 
                                            message: "Lỗi hoàn tất giao dịch",
                                            error: commitErr.message 
                                        });
                                    });
                                }

                                return res.status(200).json({ 
                                    message: "Xác nhận đơn hàng thất bại do khách hàng",
                                    deposit: Number(deposit),
                                    shippingFee: 0
                                });
                            });
                        });
                    }
                }
            });
        });
    });
};

const changeStatusOrder = (req, res) => {
    try {
        const { OrderID } = req.body;
        const sql = `UPDATE swp_shipper.orders
                    SET
                    OrderStatus = ?
                    WHERE OrderID = ?`;
        db.query(sql, [Status, OrderID], (err, results) => {
            if (err) {
                return res.status(500).send(err.message);
            }
            res.json({ message: "Status updated successfully!" });
        });
    } catch (error) {
        console.log(error);
    }
};
const getOrderDetails = async (req, res) => {
    try {
        const orderID = req.params.id;
        const sqlOrder = `SELECT * FROM swp_shipper.orders WHERE OrderID = ?;`;
        const sqlShop = `SELECT * FROM swp_shipper.shops WHERE ShopID = ?;`;
        const sqlCustomer = `SELECT * FROM swp_shipper.customers WHERE CustomerID = ?;`;
        const sqlProducts = `SELECT * FROM swp_shipper.products where OrderID = ?;`;

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
            order: order,
            shop: shop,
            customer: customer,
            products: productsResults
        });

    } catch (error) {
        console.log(error);
        res.status(500).send("Internal server error.");
    }
};


const pickOrder = (req, res) => {
    // Log toàn bộ request
    console.log('Full Request Body:', req.body);

    const { OrderID, ShipperID, ShippingFee, Deposit, EstimatedDeliveryTime } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!OrderID || !ShipperID || !ShippingFee || !Deposit || !EstimatedDeliveryTime) {
        console.error('Invalid Input:', {
            OrderID, 
            ShipperID, 
            ShippingFee, 
            Deposit, 
            EstimatedDeliveryTime
        });
        return res.status(400).json({ 
            message: "Thiếu thông tin bắt buộc",
            receivedData: req.body
        });
    }

    // Bắt đầu transaction
    db.beginTransaction((transactionError) => {
        if (transactionError) {
            console.error('Transaction Start Error:', transactionError);
            return res.status(500).json({ 
                message: "Lỗi khởi tạo giao dịch",
                error: transactionError.message 
            });
        }

        // Kiểm tra số dư
        const balanceQuery = `
            SELECT COALESCE(Balance, 0) as balance 
            FROM EWallet 
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

            // Kiểm tra số dư
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

            console.log('Balance Comparison:', {
                currentBalance,
                depositAmount,
                isEnough: currentBalance >= depositAmount
            });

            // Kiểm tra đủ số dư
            if (depositAmount > currentBalance) {
                return db.rollback(() => {
                    return res.status(400).json({ 
                        message: "Số dư không đủ",
                        currentBalance,
                        requiredDeposit: depositAmount 
                    });
                });
            }

            // Cập nhật trạng thái đơn hàng
            const updateOrderQuery = `
                UPDATE orders 
                SET OrderStatus = 'InProgress', 
                    ShipperID = ?, 
                    ShippingFee = ?, 
                    EstimatedDeliveryTime = ? 
                WHERE OrderID = ?
            `;

            db.query(
                updateOrderQuery, 
                [ShipperID, ShippingFee, EstimatedDeliveryTime, OrderID], 
                (updateOrderError, updateResult) => {
                    if (updateOrderError) {
                        return db.rollback(() => {
                            console.error('Update Order Error:', updateOrderError);
                            return res.status(500).json({ 
                                message: "Lỗi cập nhật đơn hàng",
                                error: updateOrderError.message 
                            });
                        });
                    }

                    // Kiểm tra update thành công
                    if (updateResult.affectedRows === 0) {
                        return db.rollback(() => {
                            return res.status(404).json({ 
                                message: "Không tìm thấy đơn hàng",
                                orderId: OrderID 
                            });
                        });
                    }

                    // Trừ tiền từ ví
                    const updateBalanceQuery = `
                        UPDATE EWallet 
                        SET Balance = Balance - ? 
                        WHERE ShipperID = ?
                    `;

                    db.query(
                        updateBalanceQuery, 
                        [depositAmount, ShipperID], 
                        (updateBalanceError, updateBalanceResult) => {
                            if (updateBalanceError) {
                                return db.rollback(() => {
                                    console.error('Update Balance Error:', updateBalanceError);
                                    return res.status(500).json({ 
                                        message: "Lỗi cập nhật số dư",
                                        error: updateBalanceError.message 
                                    });
                                });
                            }

                            // Tạo thông báo
                            const createNotificationQuery = `
                                INSERT INTO notifications 
                                (shipperid, message, timestamp, unread) 
                                VALUES (?, ?, NOW(), 1)
                            `;

                            db.query(
                                createNotificationQuery, 
                                [ShipperID, `Bạn đã nhận đơn hàng ${OrderID} thành công`], 
                                (notificationError) => {
                                    if (notificationError) {
                                        return db.rollback(() => {
                                            console.error('Notification Error:', notificationError);
                                            return res.status(500).json({ 
                                                message: "Lỗi tạo thông báo",
                                                error: notificationError.message 
                                            });
                                        });
                                    }

                                    // Commit transaction
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
                                }
                            );
                        }
                    );
                }
            );
        });
    });
};

const getAllMyDeliveryOrders = (req, res) => {
    const UserID = req.params.id;
    console.log(UserID);
    try {
        const sql = `SELECT * FROM swp_shipper.orders WHERE ShipperID = ?`;
        db.query(sql, [UserID], (err, results) => {
            if (err) {
                return res.status(500).send(err.message);
            }
            res.json({ orders: results });
        });
    } catch (error) {
        console.log(error);
    }
};

module.exports = { getOrdersPending, getMyDeliveryOrders, getHistoryDeliveryOrders, changeStatusOrder, getOrderDetails, pickOrder, confirmDeliveryOrder, getAllMyDeliveryOrders };
