const db = require("../config/DBConnect"); 

const getOrders = (req, res) => {
    try {
        if (req.query.page && req.query.limit) {
            let shipperID = req.query.shipperID;
            let page = req.query.page ;  
            let limit = req.query.limit ; 
            let search = req.query.search ;
            

            let offset = (page - 1) * limit;
            const countQuery = `
            SELECT COUNT(*) AS totalRows 
            FROM swp_shipper.orders o 
            JOIN swp_shipper.customers c 
            ON o.CustomerID = c.CustomerID
            WHERE ShipperID = ? And ( o.OrderStatus = "InProgress" OR o.OrderStatus =  "Pending")
                                And ( c.Fullname LIKE '%${search}%'
                                OR c.PhoneNumber LIKE '%${search}%'
                                OR c.Email LIKE '%${search}%')
            `;
            
            db.query(countQuery,[shipperID] , (err, countResults) => {
                if (err) {
                    return res.status(500).send(err.message);
                }
                
                const totalRows = countResults[0].totalRows;
                const totalPages = Math.ceil(totalRows / limit);
                
                const sql = `SELECT * 
                            FROM swp_shipper.orders o 
                            JOIN swp_shipper.customers c 
                            ON o.CustomerID = c.CustomerID
                            WHERE ShipperID = ? AND ( o.OrderStatus = "InProgress" OR o.OrderStatus =  "Pending")
                                And  ( c.Fullname LIKE '%${search}%'
                                OR c.PhoneNumber LIKE '%${search}%'
                                OR c.Email LIKE '%${search}%')
                            ORDER BY EstimatedDeliveryTime
                            LIMIT ${limit} OFFSET ${offset}`;
            
                db.query(sql, [shipperID ], (err, results) => {
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

const changeStatusOrder = (req, res) => {
    try {
        const { OrderID, Status } = req.body;
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

module.exports = { getOrders,changeStatusOrder };