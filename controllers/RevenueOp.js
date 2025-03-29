const db = require('../config/DBConnect');

// API lấy tổng quan doanh thu
const getRevenueOverview = (req, res) => {
  const { timePeriod, startDate, endDate, region, serviceType, shipperCode } = req.query;

  let query = `
    SELECT 
      SUM(TotalRevenue) as totalRevenue,
      COUNT(r.OrderID) as totalOrders,
      AVG(TotalRevenue) as avgRevenue
    FROM Revenue r
    JOIN Orders o ON r.OrderID = o.OrderID
    WHERE 1=1
  `;

  const queryParams = [];

  // Thêm bộ lọc khoảng thời gian
  if (timePeriod === 'custom' && startDate && endDate) {
    // Lọc theo khoảng thời gian tùy chỉnh
    query += ' AND r.RevenueDate BETWEEN ? AND ?';
    queryParams.push(startDate, endDate);
  } else if (timePeriod) {
    // Các lọc cố định như cũ
    switch(timePeriod) {
      case 'day':
        query += ' AND r.RevenueDate = CURRENT_DATE';
        break;
      case 'week':
        query += ' AND r.RevenueDate >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)';
        break;
      case 'month':
        query += ' AND YEAR(r.RevenueDate) = YEAR(CURRENT_DATE) AND MONTH(r.RevenueDate) = MONTH(CURRENT_DATE)';
        break;
      case 'year':
        query += ' AND YEAR(r.RevenueDate) = YEAR(CURRENT_DATE)';
        break;
    }
  }

  // Thêm bộ lọc khu vực
  if (region && region !== 'all') {
    query += ' AND o.RegionCode = ?';
    queryParams.push(region);
  }

  // Thêm bộ lọc loại dịch vụ
  if (serviceType && serviceType !== 'all') {
    query += ' AND o.ServiceType = ?';
    queryParams.push(serviceType);
  }

  // Thêm bộ lọc mã shipper
  if (shipperCode) {
    query += ' AND o.ShipperID = ?';
    queryParams.push(shipperCode);
  }

  db.query(query, queryParams, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result[0]);
  });
};

// API lấy doanh thu theo ngày
const getRevenueByDay = (req, res) => {
  const { timePeriod, startDate, endDate, region, serviceType, shipperCode } = req.query;

  let query = `
    SELECT 
      DATE_FORMAT(r.RevenueDate, '%d/%m/%Y') as date, 
      SUM(r.TotalRevenue) as revenue
    FROM Revenue r
    JOIN Orders o ON r.OrderID = o.OrderID
    WHERE 1=1
  `;

  const queryParams = [];

  // Thêm bộ lọc khoảng thời gian
  if (timePeriod === 'custom' && startDate && endDate) {
    // Lọc theo khoảng thời gian tùy chỉnh
    query += ' AND r.RevenueDate BETWEEN ? AND ?';
    queryParams.push(startDate, endDate);
  } else if (timePeriod) {
    // Các lọc cố định như cũ
    switch(timePeriod) {
      case 'day':
        query += ' AND r.RevenueDate = CURRENT_DATE';
        break;
      case 'week':
        query += ' AND r.RevenueDate >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)';
        break;
      case 'month':
        query += ' AND YEAR(r.RevenueDate) = YEAR(CURRENT_DATE) AND MONTH(r.RevenueDate) = MONTH(CURRENT_DATE)';
        break;
      case 'year':
        query += ' AND YEAR(r.RevenueDate) = YEAR(CURRENT_DATE)';
        break;
    }
  }

  // Thêm bộ lọc khu vực
  if (region && region !== 'all') {
    query += ' AND o.RegionCode = ?';
    queryParams.push(region);
  }

  // Thêm bộ lọc loại dịch vụ
  if (serviceType && serviceType !== 'all') {
    query += ' AND o.ServiceType = ?';
    queryParams.push(serviceType);
  }

  // Thêm bộ lọc mã shipper
  if (shipperCode) {
    query += ' AND o.ShipperID = ?';
    queryParams.push(shipperCode);
  }

  query += ' GROUP BY r.RevenueDate ORDER BY r.RevenueDate';

  db.query(query, queryParams, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
};

// API lấy doanh thu theo khu vực
const getRevenueByRegion = (req, res) => {
  const { timePeriod, region, serviceType, shipperCode } = req.query;

  let query = `
    SELECT 
      o.RegionCode as Region, 
      SUM(r.TotalRevenue) as revenue
    FROM Revenue r
    JOIN Orders o ON r.OrderID = o.OrderID
    WHERE 1=1
  `;

  const queryParams = [];

  // Thêm bộ lọc khoảng thời gian
  if (timePeriod) {
    switch(timePeriod) {
      case 'day':
        query += ' AND r.RevenueDate = CURRENT_DATE';
        break;
      case 'week':
        query += ' AND r.RevenueDate >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)';
        break;
      case 'month':
        query += ' AND YEAR(r.RevenueDate) = YEAR(CURRENT_DATE) AND MONTH(r.RevenueDate) = MONTH(CURRENT_DATE)';
        break;
      case 'year':
        query += ' AND YEAR(r.RevenueDate) = YEAR(CURRENT_DATE)';
        break;
    }
  }

  // Thêm bộ lọc loại dịch vụ
  if (serviceType && serviceType !== 'all') {
    query += ' AND o.ServiceType = ?';
    queryParams.push(serviceType);
  }

  // Thêm bộ lọc mã shipper
  if (shipperCode) {
    query += ' AND o.ShipperID = ?';
    queryParams.push(shipperCode);
  }

  // Không lọc theo khu vực vì đây là báo cáo theo khu vực
  query += ' GROUP BY o.RegionCode';

  db.query(query, queryParams, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Chuyển đổi kết quả để phù hợp với frontend
    const revenueByRegion = result.reduce((acc, item) => {
      acc[item.Region] = item.revenue;
      return acc;
    }, {});

    // Đảm bảo tất cả các khu vực đều có mặt trong kết quả
    const allRegions = ['central', 'mid_zone', 'outer_zone'];
    allRegions.forEach(regionCode => {
      if (!revenueByRegion[regionCode]) {
        revenueByRegion[regionCode] = 0;
      }
    });

    res.json(revenueByRegion);
  });
};

// API lấy doanh thu theo loại dịch vụ
const getRevenueByService = (req, res) => {
  const { timePeriod, region, serviceType, shipperCode } = req.query;

  let query = `
    SELECT 
      LOWER(o.ServiceType) as serviceType, 
      SUM(r.TotalRevenue) as revenue
    FROM Revenue r
    JOIN Orders o ON r.OrderID = o.OrderID
    WHERE 1=1
  `;

  const queryParams = [];

  // Thêm bộ lọc khoảng thời gian
  if (timePeriod) {
    switch(timePeriod) {
      case 'day':
        query += ' AND r.RevenueDate = CURRENT_DATE';
        break;
      case 'week':
        query += ' AND r.RevenueDate >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)';
        break;
      case 'month':
        query += ' AND YEAR(r.RevenueDate) = YEAR(CURRENT_DATE) AND MONTH(r.RevenueDate) = MONTH(CURRENT_DATE)';
        break;
      case 'year':
        query += ' AND YEAR(r.RevenueDate) = YEAR(CURRENT_DATE)';
        break;
    }
  }

  // Thêm bộ lọc khu vực
  if (region && region !== 'all') {
    query += ' AND o.RegionCode = ?';
    queryParams.push(region);
  }

  // Thêm bộ lọc mã shipper
  if (shipperCode) {
    query += ' AND o.ShipperID = ?';
    queryParams.push(shipperCode);
  }

  // Không lọc theo loại dịch vụ vì đây là báo cáo theo loại dịch vụ
  query += ' GROUP BY LOWER(o.ServiceType)';

  db.query(query, queryParams, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Chuyển đổi kết quả để phù hợp với frontend
    const revenueByService = result.reduce((acc, item) => {
      // Ensure all service types are lowercase
      acc[item.serviceType.toLowerCase()] = item.revenue;
      return acc;
    }, {});

    // Đảm bảo tất cả các loại dịch vụ đều có mặt trong kết quả
    const allServiceTypes = ['standard', 'express', 'scheduled'];
    allServiceTypes.forEach(type => {
      if (!revenueByService[type]) {
        revenueByService[type] = 0;
      }
    });

    res.json(revenueByService);
  });
};

// API lấy danh sách đơn hàng
const getOrders = (req, res) => {
  const { timePeriod, region, serviceType, shipperCode, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  let baseQuery = `
    FROM Orders o
    JOIN Revenue r ON o.OrderID = r.OrderID
    WHERE 1=1
  `;

  const queryParams = [];

  // Thêm bộ lọc khoảng thời gian
  if (timePeriod) {
    switch(timePeriod) {
      case 'day':
        baseQuery += ' AND o.OrderDate >= CURRENT_DATE';
        break;
      case 'week':
        baseQuery += ' AND o.OrderDate >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)';
        break;
      case 'month':
        baseQuery += ' AND YEAR(o.OrderDate) = YEAR(CURRENT_DATE) AND MONTH(o.OrderDate) = MONTH(CURRENT_DATE)';
        break;
      case 'year':
        baseQuery += ' AND YEAR(o.OrderDate) = YEAR(CURRENT_DATE)';
        break;
    }
  }

  // Thêm bộ lọc khu vực
  if (region && region !== 'all') {
    baseQuery += ' AND o.RegionCode = ?';
    queryParams.push(region);
  }

  // Thêm bộ lọc loại dịch vụ
  if (serviceType && serviceType !== 'all') {
    baseQuery += ' AND o.ServiceType = ?';
    queryParams.push(serviceType);
  }

  // Thêm bộ lọc mã shipper
  if (shipperCode) {
    baseQuery += ' AND o.ShipperID = ?';
    queryParams.push(shipperCode);
  }

  // Truy vấn để lấy tổng số bản ghi
  const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
  
  // Truy vấn để lấy dữ liệu phân trang
  const dataQuery = `
    SELECT 
      o.OrderID as id, 
      o.OrderDate as date, 
      o.ServiceType as type, 
      o.RegionCode as region, 
      o.DeliveryStatus as status,
      r.TotalRevenue as revenue
    ${baseQuery}
    ORDER BY o.OrderDate DESC LIMIT ? OFFSET ?`;
  
  const paginationParams = [...queryParams, parseInt(limit), parseInt(offset)];

  // Thực hiện truy vấn đếm tổng số bản ghi
  db.query(countQuery, queryParams, (countErr, countResult) => {
    if (countErr) {
      return res.status(500).json({ error: countErr.message });
    }

    const totalCount = countResult[0].total;

    // Thực hiện truy vấn lấy dữ liệu
    db.query(dataQuery, paginationParams, (dataErr, dataResult) => {
      if (dataErr) {
        return res.status(500).json({ error: dataErr.message });
      }

      // Định dạng kết quả để phù hợp với frontend
      const formattedResults = dataResult.map(order => ({
        ...order,
        date: order.date ? new Date(order.date).toLocaleDateString('vi-VN') : null
      }));

      // Trả về cả dữ liệu và tổng số bản ghi
      res.json({
        orders: formattedResults,
        totalCount: totalCount
      });
    });
  });
};

// API lấy lịch sử thanh toán
const getPayments = (req, res) => {
  const { shipperCode, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT 
      TransactionID as id, 
      TransactionDate as date, 
      Amount as amount, 
      PaymentMethod as method, 
      Status as status
    FROM transactionhistory
    WHERE 1=1
  `;

  const queryParams = [];

  // Thêm bộ lọc mã shipper nếu có
  if (shipperCode) {
    query += ' AND ShipperID = ?';
    queryParams.push(shipperCode);
  }

  query += ' ORDER BY PaymentDate DESC LIMIT ? OFFSET ?';
  queryParams.push(parseInt(limit), parseInt(offset));

  db.query(query, queryParams, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Định dạng kết quả để phù hợp với frontend
    const formattedResults = result.map(payment => ({
      ...payment,
      date: payment.date ? new Date(payment.date).toLocaleDateString('vi-VN') : null
    }));

    res.json(formattedResults);
  });
};

// API lấy danh sách phí dịch vụ
const getFees = (req, res) => {
  const query = `
    SELECT 
      FeeType as type, 
      Description as description, 
      Amount as amount, 
      Percentage as percentage
    FROM ServiceFees
  `;

  db.query(query, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
};

// API lấy cảnh báo doanh thu
const getAlerts = (req, res) => {
  const query = `
    SELECT 
      AlertType as type, 
      Message as message
    FROM RevenueAlerts
    WHERE IsActive = TRUE
  `;

  db.query(query, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
};

module.exports = {
  getRevenueOverview,
  getRevenueByDay,
  getRevenueByRegion,
  getRevenueByService,
  getOrders,
  getPayments,
  getFees,
  getAlerts
};