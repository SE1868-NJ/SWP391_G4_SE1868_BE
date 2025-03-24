const db = require('../config/DBConnect');
const { validationResult } = require('express-validator');
const { getShippers } = require('./Manageshipper');
const ExcelJS = require('exceljs');
const pdfMake = require('pdfmake');
const fs = require('fs');
const path = require('path');

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
const exportReportExcel = async (req, res) => {
  try {
    const { incidents, summaryStats, typeStats, timeStats, exportDate, exportedBy } = req.body;
    
    // Tạo workbook mới
    const workbook = new ExcelJS.Workbook();
    workbook.creator = exportedBy;
    workbook.created = new Date(exportDate);
    
    // Tạo worksheet cho danh sách sự cố
    const incidentsSheet = workbook.addWorksheet('Danh sách sự cố');
    
    // Định dạng tiêu đề
    incidentsSheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Shipper', key: 'shipper', width: 20 },
      { header: 'Loại sự cố', key: 'type', width: 20 },
      { header: 'Trạng thái', key: 'status', width: 15 },
      { header: 'Ngày báo cáo', key: 'date', width: 20 },
      { header: 'Người báo cáo', key: 'reportedBy', width: 20 },
      { header: 'Mức độ', key: 'severity', width: 15 }
    ];
    
    // Thêm dữ liệu
    incidentsSheet.addRows(incidents);
    
    // Định dạng tiêu đề
    incidentsSheet.getRow(1).font = { bold: true };
    incidentsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
    
    // Worksheet thống kê
    const statsSheet = workbook.addWorksheet('Thống kê');
    
    // Thêm dữ liệu tổng quan
    statsSheet.addRow(['BÁO CÁO TỔNG QUAN SỰ CỐ']);
    statsSheet.addRow(['Ngày xuất báo cáo:', new Date(exportDate).toLocaleDateString('vi-VN')]);
    statsSheet.addRow(['Người xuất báo cáo:', exportedBy]);
    statsSheet.addRow([]);
    
    statsSheet.addRow(['CHỈ SỐ TỔNG QUAN']);
    statsSheet.addRow(['Tổng số sự cố:', summaryStats.totalIncidents]);
    statsSheet.addRow(['Đang xử lý:', summaryStats.inProgressCount]);
    statsSheet.addRow(['Đã xử lý:', summaryStats.resolvedCount]);
    statsSheet.addRow(['Tỷ lệ xử lý thành công:', `${summaryStats.successRate}%`]);
    statsSheet.addRow(['Thời gian xử lý trung bình:', `${summaryStats.avgResolutionDays} ngày`]);
    statsSheet.addRow(['Sự cố nghiêm trọng:', summaryStats.severeCases]);
    statsSheet.addRow(['Shipper có nhiều sự cố:', summaryStats.topShipper]);
    statsSheet.addRow([]);
    
    // Thống kê theo loại sự cố
    statsSheet.addRow(['THỐNG KÊ THEO LOẠI SỰ CỐ']);
    statsSheet.addRow(['Loại sự cố', 'Số lượng']);
    typeStats.forEach(item => {
      statsSheet.addRow([item.name, item.value]);
    });
    statsSheet.addRow([]);
    
    // Định dạng tiêu đề và phần thống kê
    statsSheet.getCell('A1').font = { bold: true, size: 16 };
    statsSheet.getCell('A5').font = { bold: true, size: 14 };
    statsSheet.getCell('A14').font = { bold: true, size: 14 };
    statsSheet.getRow(15).font = { bold: true };
    
    // Viết file và trả về
    const buffer = await workbook.xlsx.writeBuffer();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=bao-cao-su-co.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Error generating Excel:', error);
    res.status(500).send({ error: 'Không thể tạo file Excel' });
  }
};

const exportReportPdf = async (req, res) => {
  try {
    const { incidents, summaryStats, typeStats, timeStats, exportDate, exportedBy } = req.body;
    
    // Định nghĩa phông chữ
    const fonts = {
      Roboto: {
        normal: path.resolve(__dirname, '../controllers/fonts/Roboto-Regular.ttf'),
        bold: path.resolve(__dirname, '../controllers/fonts/Roboto-Bold.ttf'),
        italics: path.resolve(__dirname, '../controllers/fonts/Roboto-Italic.ttf'),
        bolditalics: path.resolve(__dirname, '../controllers/fonts/Roboto-BoldItalic.ttf')
      }
    };
    
    // Tạo printer
    const printer = new pdfMake(fonts);
    
    // Dữ liệu thống kê
    const statsTableData = [
      ['Chỉ số', 'Giá trị'],
      ['Tổng số sự cố', summaryStats.totalIncidents],
      ['Đang xử lý', summaryStats.inProgressCount],
      ['Đã xử lý', summaryStats.resolvedCount],
      ['Tỷ lệ xử lý thành công', `${summaryStats.successRate}%`],
      ['Thời gian xử lý trung bình', `${summaryStats.avgResolutionDays} ngày`],
      ['Sự cố nghiêm trọng', summaryStats.severeCases],
      ['Shipper có nhiều sự cố', summaryStats.topShipper]
    ];
    
    // Dữ liệu sự cố
    const incidentTableData = [
      ['ID', 'Shipper', 'Loại sự cố', 'Trạng thái', 'Ngày báo cáo', 'Mức độ']
    ];
    
    // Lấy 10 sự cố đầu tiên
    const top10Incidents = incidents.slice(0, 10);
    
    top10Incidents.forEach(incident => {
      incidentTableData.push([
        incident.id.toString(),
        incident.shipper,
        incident.type,
        incident.status,
        incident.date,
        incident.severity
      ]);
    });
    
    // Dữ liệu thống kê theo loại
    const typeTableData = [
      ['Loại sự cố', 'Số lượng']
    ];
    
    typeStats.forEach(item => {
      typeTableData.push([item.name, item.value.toString()]);
    });
    
    // Định nghĩa document
    const docDefinition = {
      content: [
        { text: 'BÁO CÁO SỰ CỐ', style: 'header' },
        
        { text: `Ngày xuất báo cáo: ${new Date(exportDate).toLocaleDateString('vi-VN')}`, margin: [0, 10, 0, 0] },
        { text: `Người xuất báo cáo: ${exportedBy}`, margin: [0, 5, 0, 10] },
        
        { text: 'Thống kê tổng quan', style: 'subheader' },
        {
          table: {
            body: statsTableData,
            widths: ['*', 100]
          },
          margin: [0, 5, 0, 15]
        },
        
        { text: 'Danh sách sự cố (Top 10)', style: 'subheader', pageBreak: 'before' },
        {
          table: {
            headerRows: 1,
            body: incidentTableData,
            widths: [30, 60, 80, 60, 80, 50]
          },
          margin: [0, 5, 0, 15]
        },
        
        { text: 'Thống kê theo loại sự cố', style: 'subheader', pageBreak: 'before' },
        {
          table: {
            headerRows: 1,
            body: typeTableData,
            widths: ['*', 100]
          },
          margin: [0, 5, 0, 0]
        }
      ],
      styles: {
        header: {
          fontSize: 20,
          bold: true,
          alignment: 'center',
          margin: [0, 0, 0, 10]
        },
        subheader: {
          fontSize: 16,
          bold: true,
          margin: [0, 10, 0, 5]
        }
      },
      defaultStyle: {
        font: 'Roboto'
      }
    };
    
    // Tạo PDF
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    
    // Set headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=bao-cao-su-co.pdf');
    
    // Pipe PDF thẳng đến response
    pdfDoc.pipe(res);
    pdfDoc.end();
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send({ error: 'Không thể tạo file PDF' });
  }
};
// Hàm loại bỏ dấu tiếng Việt
function removeVietnameseAccents(str) {
  if (!str) return '';
  
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

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
  getSummaryStats,
  getIncidentTypeStats,
  getIncidentTimeStats,
  getIncidentShipperStats,
  exportReportExcel,
  exportReportPdf,
  getShippers_Incident,
  getIncidentCategories
};