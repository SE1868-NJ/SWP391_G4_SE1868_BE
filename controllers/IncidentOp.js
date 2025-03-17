const db = require('../config/DBConnect');
const { validationResult } = require('express-validator');
const { getShippers } = require('./Manageshipper');

// ======= API lấy danh sách sự cố =======
const getIncidents = async (req, res) => {
  try {
    // Lấy các query parameter
    let dbStatus = req.query.dbStatus || null;
    const search = req.query.search || null;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Xây dựng query dựa trên filter
    let query = `
      SELECT 
        i.ReportID as id, 
        s.FullName as shipper, 
        i.IncidentCategory as type, 
        CASE 
          WHEN i.Status = 'Pending' THEN 'Chưa xử lý'
          WHEN i.Status = 'In Progress' THEN 'Đang xử lý'
          WHEN i.Status = 'Resolved' THEN 'Đã xử lý'
          WHEN i.Status = 'Rejected' THEN 'Từ chối'
        END as status,
        DATE_FORMAT(i.ReportDate, '%Y-%m-%d') as date,
        i.ReportedBy as reportedBy,
        i.Severity as severity,
        i.Description as description,
        o.OrderID as orderID
      FROM incidentreports i
      JOIN shippers s ON i.ShipperID = s.ShipperID
      LEFT JOIN orders o ON i.OrderID = o.OrderID
      WHERE 1=1
    `;
    
    let countQuery = `
      SELECT COUNT(*) as total
      FROM incidentreports i
      JOIN shippers s ON i.ShipperID = s.ShipperID
      WHERE 1=1
    `;
    console.log("Received status:", dbStatus);
    let queryParams = [];
    let countQueryParams = [];
    
    // Thêm điều kiện tìm kiếm nếu có
    if (search) {
      query += ` AND s.FullName LIKE ?`;
      countQuery += ` AND s.FullName LIKE ?`;
      queryParams.push(`%${search}%`);
      countQueryParams.push(`%${search}%`);
    }
    
    // Thêm điều kiện lọc trạng thái nếu khác 'Tất cả'
      
      if (dbStatus) {
        query += ` AND i.Status = ?`;
        countQuery += ` AND i.Status = ?`;
        queryParams.push(dbStatus);
        countQueryParams.push(dbStatus);
      }
    
    
    // Thêm phân trang
    query += ` ORDER BY i.ReportDate DESC LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);
    
    // Thực hiện truy vấn
    const [incidents] = await db.promise().query(query, queryParams);
    const [countResult] = await db.promise().query(countQuery, countQueryParams);
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);
    
    console.log("Incidents:", incidents);
    res.json({
      incidents,
      pagination: {
        total: totalItems,
        page,
        limit,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy danh sách sự cố' });
  }
};

// ======= API lấy chi tiết sự cố =======
const getIncidentById = async (req, res) => {
  try {
    const [incident] = await db.promise().query(
      `SELECT 
        i.ReportID as id,
        i.ShipperID as shipperID, 
        s.FullName as shipperName,
        i.OrderID as orderID,
        i.IncidentType as incidentType,
        i.IncidentCategory as incidentCategory,
        i.Description as description,
        DATE_FORMAT(i.ReportDate, '%Y-%m-%d %H:%i:%s') as reportDate,
        DATE_FORMAT(i.AdminResolutionDate, '%Y-%m-%d %H:%i:%s') as resolutionDate,
        CASE 
          WHEN i.Status = 'Pending' THEN 'Chưa xử lý'
          WHEN i.Status = 'In Progress' THEN 'Đang xử lý'
          WHEN i.Status = 'Resolved' THEN 'Đã xử lý'
          WHEN i.Status = 'Rejected' THEN 'Từ chối'
        END as status,
        i.Status as rawStatus,
        i.ReportedBy as reportedBy,
        i.Severity as severity,
        i.IncidentDuration as duration,
        DATE_FORMAT(i.LastUpdated, '%Y-%m-%d %H:%i:%s') as lastUpdated
       FROM incidentreports i
       JOIN shippers s ON i.ShipperID = s.ShipperID
       WHERE i.ReportID = ?`,
      [req.params.id]
    );
    
    if (incident.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy sự cố' });
    }
    
    res.json(incident[0]);
  } catch (error) {
    console.error('Error fetching incident details:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy chi tiết sự cố' });
  }
};

// ======= API cập nhật trạng thái sự cố =======
const updateIncidentStatus = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { status } = req.body;
    const incidentId = req.params.id;
    
    // Map UI status to database status
    let dbStatus;
    switch(status) {
      case 'Chưa xử lý':
        dbStatus = 'Pending';
        break;
      case 'Đang xử lý':
        dbStatus = 'In Progress';
        break;
      case 'Đã xử lý':
        dbStatus = 'Resolved';
        break;
      case 'Từ chối':
        dbStatus = 'Rejected';
        break;
    }
    
    // Set resolution date if status is 'Resolved'
    const updateQuery = dbStatus === 'Resolved' 
      ? `UPDATE incidentreports SET Status = ?, AdminResolutionDate = CURRENT_TIMESTAMP WHERE ReportID = ?`
      : `UPDATE incidentreports SET Status = ? WHERE ReportID = ?`;
    
    const [result] = await db.promise().query(updateQuery, [dbStatus, incidentId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy sự cố' });
    }
    
    res.json({ message: 'Cập nhật trạng thái thành công' });
  } catch (error) {
    console.error('Error updating incident status:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi cập nhật trạng thái sự cố' });
  }
};

// ======= API lấy số liệu thống kê tổng quan =======
const getSummaryStats = async (req, res) => {
  try {
    // Lấy số liệu thống kê cơ bản
    const [stats] = await db.promise().query(`
      SELECT 
        (SELECT COUNT(*) FROM incidentreports) as totalIncidents,
        (SELECT COUNT(*) FROM incidentreports WHERE Status = 'In Progress') as inProgressCount,
        (SELECT COUNT(*) FROM incidentreports WHERE Status = 'Resolved') as resolvedCount,
        (SELECT COUNT(DISTINCT ShipperID) FROM incidentreports) as totalShippers,
        (SELECT AVG(TIMESTAMPDIFF(HOUR, ReportDate, AdminResolutionDate)) / 24 
         FROM incidentreports 
         WHERE AdminResolutionDate IS NOT NULL) as avgResolutionDays,
        (SELECT COUNT(*) FROM incidentreports WHERE Severity = 'Cao') as severeCases,
        (SELECT 
           s.FullName
         FROM incidentreports i
         JOIN shippers s ON i.ShipperID = s.ShipperID
         GROUP BY i.ShipperID
         ORDER BY COUNT(*) DESC
         LIMIT 1) as topShipper,
        (SELECT 
           ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM incidentreports)), 2)
         FROM incidentreports
         WHERE Status = 'Resolved') as successRate
    `);
    res.json({
      totalIncidents: stats[0].totalIncidents || 0,
      inProgressCount: stats[0].inProgressCount || 0,
      resolvedCount: stats[0].resolvedCount || 0,
      totalShippers: stats[0].totalShippers || 0,
      avgResolutionDays: stats[0].avgResolutionDays ? parseFloat(stats[0].avgResolutionDays).toFixed(1) : "0",
      severeCases: stats[0].severeCases || 0,
      topShipper: stats[0].topShipper || "N/A",
      successRate: stats[0].successRate || 0
    });
  } catch (error) {
    console.error('Error fetching summary stats:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy số liệu thống kê' });
  }
};

// ======= API lấy dữ liệu biểu đồ sự cố theo loại =======
const getIncidentTypeStats = async (req, res) => {
  try {
    const [data] = await db.promise().query(`
      SELECT 
        IncidentCategory as name,
        COUNT(*) as value
      FROM incidentreports
      GROUP BY IncidentCategory
      ORDER BY value DESC
    `);
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching incident type stats:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy thống kê theo loại sự cố' });
  }
};

// ======= API lấy dữ liệu biểu đồ sự cố theo thời gian =======
const getIncidentTimeStats = async (req, res) => {
  try {
    // Mặc định lấy dữ liệu 10 ngày gần nhất
    const days = parseInt(req.query.days) || 10;
    
    const [data] = await db.promise().query(`
      SELECT 
        DATE_FORMAT(ReportDate, '%d/%m') as name,
        COUNT(*) as count
      FROM incidentreports
      WHERE ReportDate >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)
      GROUP BY DATE_FORMAT(ReportDate, '%d/%m')
      ORDER BY DATE_FORMAT(ReportDate, '%d/%m');
    `, [days]);
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching incident time stats:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy thống kê theo thời gian' });
  }
};

// ======= API lấy dữ liệu biểu đồ sự cố theo shipper =======
const getIncidentShipperStats = async (req, res) => {
  try {
    // Mặc định lấy top 5 shipper có nhiều sự cố nhất
    const limit = parseInt(req.query.limit) || 5;
    
    const [data] = await db.promise().query(`
      SELECT 
        s.FullName as name,
        COUNT(*) as count
      FROM incidentreports i
      JOIN shippers s ON i.ShipperID = s.ShipperID
      GROUP BY i.ShipperID
      ORDER BY count DESC
      LIMIT ?
    `, [limit]);
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching incident shipper stats:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy thống kê theo shipper' });
  }
};

// ======= API xuất báo cáo =======
const exportReport = async (req, res) => {
  try {
    const format = req.query.format || 'json'; // Mặc định là json nếu không có format được chỉ định
    
    // Lấy dữ liệu cho báo cáo
    const [incidents] = await db.promise().query(`
      SELECT 
        i.ReportID as id,
        s.FullName as shipperName,
        i.IncidentCategory as incidentType,
        CASE 
          WHEN i.Status = 'Pending' THEN 'Chưa xử lý'
          WHEN i.Status = 'In Progress' THEN 'Đang xử lý'
          WHEN i.Status = 'Resolved' THEN 'Đã xử lý'
          WHEN i.Status = 'Rejected' THEN 'Từ chối'
        END as status,
        DATE_FORMAT(i.ReportDate, '%Y-%m-%d') as reportDate,
        i.ReportedBy as reportedBy,
        i.Severity as severity,
        DATE_FORMAT(i.AdminResolutionDate, '%Y-%m-%d') as resolutionDate,
        i.Description as description,
        TIMESTAMPDIFF(HOUR, i.ReportDate, IFNULL(i.AdminResolutionDate, NOW())) / 24 as durationDays
      FROM incidentreports i
      JOIN shippers s ON i.ShipperID = s.ShipperID
      ORDER BY i.ReportDate DESC
    `);
    
    // Xử lý format dựa trên yêu cầu (trong thực tế bạn sẽ cần thêm các thư viện để xuất Excel/PDF)
    if (format === 'excel') {
      // Placeholder cho logic xuất Excel - thực tế sẽ sử dụng thư viện như exceljs
      res.setHeader('Content-Type', 'application/json');
      res.json({ 
        message: 'Tính năng xuất Excel sẽ được triển khai khi tích hợp thư viện',
        data: incidents 
      });
    } else if (format === 'pdf') {
      // Placeholder cho logic xuất PDF - thực tế sẽ sử dụng thư viện như PDFKit
      res.setHeader('Content-Type', 'application/json');
      res.json({ 
        message: 'Tính năng xuất PDF sẽ được triển khai khi tích hợp thư viện',
        data: incidents 
      });
    } else {
      // Mặc định trả về JSON
      res.json(incidents);
    }
  } catch (error) {
    console.error('Error exporting incidents:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi xuất báo cáo' });
  }
};

// ======= API tạo báo cáo sự cố mới =======
const createIncident = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { 
      shipperID, 
      orderID, 
      incidentType, 
      incidentCategory, 
      description, 
      reportedBy, 
      severity 
    } = req.body;
    
    // Insert new incident
    const [result] = await db.promise().query(
      `INSERT INTO incidentreports 
        (ShipperID, OrderID, IncidentType, IncidentCategory, Description, ReportedBy, Severity, Status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [shipperID, orderID || null, incidentType, incidentCategory, description, reportedBy, severity]
    );
    
    res.status(201).json({ 
      message: 'Tạo báo cáo sự cố thành công', 
      incidentID: result.insertId 
    });
  } catch (error) {
    console.error('Error creating incident:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi tạo báo cáo sự cố' });
  }
};

// ======= API cập nhật thông tin sự cố =======
const updateIncident = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const incidentId = req.params.id;
    const { description, severity, incidentCategory } = req.body;
    
    // Xây dựng SQL update động dựa trên các trường được cung cấp
    let updateFields = [];
    let queryParams = [];
    
    if (description) {
      updateFields.push('Description = ?');
      queryParams.push(description);
    }
    
    if (severity) {
      updateFields.push('Severity = ?');
      queryParams.push(severity);
    }
    
    if (incidentCategory) {
      updateFields.push('IncidentCategory = ?');
      queryParams.push(incidentCategory);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'Không có thông tin nào được cập nhật' });
    }
    
    // Thêm ID vào cuối params
    queryParams.push(incidentId);
    
    const [result] = await db.promise().query(
      `UPDATE incidentreports SET ${updateFields.join(', ')} WHERE ReportID = ?`,
      queryParams
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy sự cố' });
    }
    
    res.json({ message: 'Cập nhật thông tin sự cố thành công' });
  } catch (error) {
    console.error('Error updating incident:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi cập nhật thông tin sự cố' });
  }
};

// ======= API lấy danh sách shipper =======
const getShippers_Incident = async (req, res) => {
  try {
    const [shippers] = await db.promise().query(
      `SELECT ShipperID as id, FullName as name FROM shippers ORDER BY FullName`
    );
    
    res.json(shippers);
  } catch (error) {
    console.error('Error fetching shippers:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy danh sách shipper' });
  }
};

// ======= API lấy danh mục loại sự cố =======
const getIncidentCategories = async (req, res) => {
  try {
    const incidentType = req.query.type; // Optional filter by incident type
    
    let query = `
      SELECT DISTINCT IncidentCategory as category
      FROM incidentreports
      WHERE 1=1
    `;
    
    let params = [];
    
    if (incidentType) {
      query += ` AND IncidentType = ?`;
      params.push(incidentType);
    }
    
    query += ` ORDER BY IncidentCategory`;
    
    const [categories] = await db.promise().query(query, params);
    
    res.json(categories.map(item => item.category));
  } catch (error) {
    console.error('Error fetching incident categories:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy danh mục loại sự cố' });
  }
};

module.exports = {
  getIncidents,
  getIncidentById,
  updateIncidentStatus,
  getSummaryStats,
  getIncidentTypeStats,
  getIncidentTimeStats,
  getIncidentShipperStats,
  exportReport,
  createIncident,
  updateIncident,
  getShippers_Incident,
  getIncidentCategories
};