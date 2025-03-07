const db = require("../config/DBConnect");

// Báo cáo sự cố đơn hàng
const createOrderReport = (req, res) => {
    const { orderId, incidentCategory, description } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!orderId || !incidentCategory || !description) {
        return res.status(400).json({ 
            success: false, 
            message: "Vui lòng cung cấp đầy đủ thông tin" 
        });
    }

    // Truy vấn để lấy thông tin đơn hàng
    const orderQuery = "SELECT ShipperID FROM orders WHERE OrderID = ?";
    db.query(orderQuery, [orderId], (orderErr, orderResults) => {
        if (orderErr) {
            return res.status(500).json({ 
                success: false, 
                message: "Lỗi truy vấn đơn hàng" 
            });
        }

        if (orderResults.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "Không tìm thấy đơn hàng" 
            });
        }

        const shipperID = orderResults[0].ShipperID;

        // Thêm báo cáo sự cố
        const insertQuery = `
            INSERT INTO incidentreports 
            (ShipperID, OrderID, IncidentType, Description, IncidentCategory, Status) 
            VALUES (?, ?, 'Giao hàng', ?, ?, 'Pending')
        `;
        
        db.query(insertQuery, [shipperID, orderId, description, incidentCategory], (insertErr, insertResult) => {
            if (insertErr) {
                return res.status(500).json({ 
                    success: false, 
                    message: "Lỗi tạo báo cáo" 
                });
            }

            res.status(201).json({ 
                success: true, 
                message: "Báo cáo sự cố đã được gửi",
                reportId: insertResult.insertId 
            });
        });
    });
};

// Báo cáo sự cố đối với Shipper
const createShipperReport = (req, res) => {
    const { incidentCategory, description, shipperId } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!incidentCategory || !description|| !shipperId) {
        return res.status(400).json({ 
            success: false, 
            message: "Vui lòng cung cấp đầy đủ thông tin" 
        });
    }

    // Thêm báo cáo sự cố
    const insertQuery = `
        INSERT INTO incidentreports 
        (ShipperID, IncidentType, Description, IncidentCategory, Status) 
        VALUES (?, 'Tai nạn', ?, ?, 'Pending')
    `;
    
    db.query(insertQuery, [shipperId, description, incidentCategory], (insertErr, insertResult) => {
        if (insertErr) {
            return res.status(500).json({ 
                success: false, 
                message: "Lỗi tạo báo cáo" 
            });
        }

        res.status(201).json({ 
            success: true, 
            message: "Báo cáo sự cố đã được gửi",
            reportId: insertResult.insertId 
        });
    });
};

// Lấy báo cáo đơn hàng
const getOrderReports = (req, res) => {
    const query = `
        SELECT 
            ir.*, 
            o.DeliveryAddress, 
            s.FullName as ShipperName, 
            s.PhoneNumber as ShipperPhoneNumber
        FROM incidentreports ir
        LEFT JOIN orders o ON ir.OrderID = o.OrderID
        LEFT JOIN shippers s ON ir.ShipperID = s.ShipperID
        WHERE ir.IncidentType = 'Giao hàng'
        ORDER BY ir.ReportDate DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: "Lỗi lấy báo cáo" 
            });
        }

        res.json({
            success: true,
            orderReports: results
        });
    });
};

// Lấy báo cáo sự cố Shipper
const getShipperReports = (req, res) => {
    const query = `
        SELECT 
            ir.*, 
            s.FullName as ShipperName, 
            s.PhoneNumber as ShipperPhoneNumber
        FROM incidentreports ir
        LEFT JOIN shippers s ON ir.ShipperID = s.ShipperID
        WHERE ir.IncidentType = 'Tai nạn'
        ORDER BY ir.ReportDate DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: "Lỗi lấy báo cáo" 
            });
        }

        res.json({
            success: true,
            shipperReports: results
        });
    });
};

// Cập nhật trạng thái báo cáo
const updateReportStatus = (req, res) => {
    const { reportId } = req.params;
    const { status } = req.body;

    const query = `
        UPDATE incidentreports 
        SET 
            Status = ?, 
            AdminResolutionDate = NOW() 
        WHERE ReportID = ?
    `;

    db.query(query, [status, reportId], (err, result) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: "Lỗi cập nhật trạng thái" 
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "Không tìm thấy báo cáo" 
            });
        }

        res.json({ 
            success: true, 
            message: "Cập nhật trạng thái thành công" 
        });
    });
};

// Lấy báo cáo đơn hàng cho customer
const getCustomerOrderReports = (req, res) => {
    const { customerId } = req.query; // Thêm customerId từ query

    const query = `
        SELECT 
            ir.*, 
            o.DeliveryAddress, 
            s.FullName as ShipperName, 
            s.PhoneNumber as ShipperPhoneNumber
        FROM incidentreports ir
        JOIN orders o ON ir.OrderID = o.OrderID
        LEFT JOIN shippers s ON ir.ShipperID = s.ShipperID
        WHERE ir.IncidentType = 'Giao hàng'
        AND o.CustomerID = ?
        ORDER BY ir.ReportDate DESC
    `;

    db.query(query, [customerId], (err, results) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: "Lỗi lấy báo cáo" 
            });
        }

        res.json({
            success: true,
            orderReports: results
        });
    });
};

module.exports = {
    createOrderReport,
    createShipperReport,
    getOrderReports,
    getShipperReports,
    updateReportStatus,
    getCustomerOrderReports
};