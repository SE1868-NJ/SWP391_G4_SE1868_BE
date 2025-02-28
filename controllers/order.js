const db = require("../config/DBConnect"); 

const getOrdersInProgress = (req, res) => {
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
            WHERE ( o.OrderStatus = "InProgress")
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


module.exports = { getOrdersInProgress,changeStatusOrder,getOrderDetails };