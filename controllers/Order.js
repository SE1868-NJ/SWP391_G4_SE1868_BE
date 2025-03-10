const db = require("../config/DBConnect"); 
const { createOrderNotification } = require("./NotificationController");

const getOrdersPending = (req, res) => {
    try {
        if (req.query.page && req.query.limit) {
            let page = req.query.page ;  
            let limit = req.query.limit ; 
            let search = req.query.search ;
            
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
        }else{
            const sql = `SELECT *
            FROM swp_shipper.orders o 
            join swp_shipper.customers c on o.CustomerID = c.CustomerID`;
            db.query(sql, (err, results) => {
                if (err) {
                    return res.status(500).send(err.message);
                }
                res.json({
                    orders: results});
            });
        }
    } catch (error) {
        console.log(error);
    }
};

const confirmDeliveryOrder = (req, res) => {
    const { OrderID, Status } = req.body;
    try {
        const sql = `UPDATE swp_shipper.orders
                    SET
                    OrderStatus = ?,
                    ActualDeliveryTime = CURRENT_TIMESTAMP
                    WHERE OrderID = ?`;
        
        db.query(sql, [Status, OrderID], async (err, results) => {
            if (err) {
                return res.status(500).send(err.message);
            }

            try {
                // Lấy thông tin shipper từ đơn hàng
                const shipperQuery = 'SELECT ShipperID FROM swp_shipper.orders WHERE OrderID = ?';
                db.query(shipperQuery, [OrderID], async (shipperErr, shipperResults) => {
                    if (shipperErr) {
                        console.error("Error fetching shipper:", shipperErr);
                        return res.json({ message: "Status updated successfully!" });
                    }

                    if (shipperResults.length > 0) {
                        const shipperId = shipperResults[0].ShipperID;
                        // Tạo thông báo khi xác nhận đơn
                        await createOrderNotification(shipperId, OrderID, Status);
                    }

                    res.json({ message: "Status updated successfully!" });
                });
            } catch (notifError) {
                console.error("Error creating notification:", notifError);
                res.json({ message: "Status updated successfully, but notification failed" });
            }
        });
    } catch(error) {
        console.log(error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(500).send('OrderID already exists');  
        }
    }
};

const pickOrder = (req, res) => {
    const { OrderID, ShipperID, ShippingFee, EstimatedDeliveryTime } = req.body;

    if (!OrderID || !ShipperID || !ShippingFee || !EstimatedDeliveryTime) {
        return res.status(400).json({ message: "Missing required fields" });
    }
    const sql = `
        UPDATE orders
        SET ShipperID = ?, OrderStatus = 'InProgress', ShippingFee = ?, EstimatedDeliveryTime = ?
        WHERE OrderID = ?
    `;

    db.query(sql, [ShipperID, ShippingFee, EstimatedDeliveryTime, OrderID], async (err, result) => {
        if (err) {
            console.error("Error updating order:", err);
            return res.status(500).json({ message: "Internal Server Error" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Order not found" });
        }

        try {
            // Tạo thông báo khi nhận đơn
            await createOrderNotification(ShipperID, OrderID, 'InProgress');
            
            res.status(200).json({ message: "Order picked successfully", orderId: OrderID });
        } catch (notifError) {
            console.error("Error creating notification:", notifError);
            res.status(200).json({ message: "Order picked successfully, but notification failed" });
        }
    });
};

// Giữ nguyên các hàm còn lại
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

const getMyDeliveryOrders = (req, res) => {
    try {
        if (req.query.page && req.query.limit) {
            let page = req.query.page ;  
            let limit = req.query.limit ; 
            let search = req.query.search ;
            let shipperID = req.query.shipperId ;
            
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
        }else{
            const sql = `SELECT *
            FROM swp_shipper.orders o 
            WHERE o.ShipperID = ${shipperID}
            join swp_shipper.customers c on o.CustomerID = c.CustomerID`;
            db.query(sql, (err, results) => {
                if (err) {
                    return res.status(500).send(err.message);
                }
                res.json({
                    orders: results});
            });
        }
    } catch (error) {
        console.log(error);
    }
};

// Giữ nguyên các hàm còn lại
const getHistoryDeliveryOrders = (req, res) => {
    try {
        if (req.query.page && req.query.limit) {
            let page = req.query.page ;  
            let limit = req.query.limit ; 
            let search = req.query.search ;
            let status = req.query.status ;
            let shipperID = req.query.shipperId ;
            
            console.log(status); 

            let offset = (page - 1) * limit;
            let countQuery = `
            SELECT COUNT(*) AS totalRows 
            FROM swp_shipper.orders o 
            JOIN swp_shipper.customers c 
            ON o.CustomerID = c.CustomerID
            WHERE `;

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
        }else{
            const sql = `SELECT *
            FROM swp_shipper.orders o 
            WHERE o.ShipperID = ${shipperID}
            join swp_shipper.customers c on o.CustomerID = c.CustomerID`;
            db.query(sql, (err, results) => {
                if (err) {
                    return res.status(500).send(err.message);
                }
                res.json({
                    orders: results});
            });
        }
    } catch (error) {
        console.log(error);
    }
};

// Giữ nguyên các hàm còn lại như getOrderDetails, getAllMyDeliveryOrders, v.v.

module.exports = { 
    getOrdersPending,
    getMyDeliveryOrders,
    getHistoryDeliveryOrders,
    confirmDeliveryOrder,
    pickOrder,
    // Giữ nguyên các hàm khác
    changeStatusOrder,
    getOrderDetails,
    getAllMyDeliveryOrders
};