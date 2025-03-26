const db = require("../config/DBConnect");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config/jwtConfig");

// Hàm loginCustomer (đã có sẵn)
const loginCustomer = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng nhập đầy đủ email và mật khẩu",
    });
  }

  try {
    const sql = "SELECT * FROM customers WHERE Email = ?";
    db.query(sql, [email], (err, results) => {
      if (err) {
        console.error("Lỗi truy vấn:", err);
        return res.status(500).json({
          success: false,
          message: "Lỗi hệ thống. Vui lòng thử lại",
        });
      }

      if (results.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Email không tồn tại",
        });
      }

      const customer = results[0];

      if (password !== customer.Password) {
        return res.status(401).json({
          success: false,
          message: "Mật khẩu không chính xác",
        });
      }

      const token = jwt.sign(
        {
          customerId: customer.CustomerID,
          FullName: customer.FullName,
          Email: customer.Email,
        },
        SECRET_KEY,
        { expiresIn: "1h" }
      );

      return res.json({
        success: true,
        token: token,
        customer: {
          CustomerID: customer.CustomerID,
          FullName: customer.FullName,
          Email: customer.Email,
        },
      });
    });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống. Vui lòng thử lại",
    });
  }
};

// Hàm getCustomerOrders (đã có sẵn)
const getCustomerOrders = (req, res) => {
  const customerId = req.user.customerId;

  const sql = `
    SELECT 
      o.OrderID, 
      o.OrderStatus, 
      o.ShippingFee, 
      o.DeliveryAddress, 
      o.OrderDate, 
      o.EstimatedDeliveryTime, 
      o.ActualDeliveryTime, 
      o.ShopAddress,
      GROUP_CONCAT(p.ProductName) AS ProductNames
    FROM orders o
    LEFT JOIN products p ON o.OrderID = p.OrderID
    WHERE o.CustomerID = ?
    GROUP BY o.OrderID
    ORDER BY o.OrderDate DESC
  `;

  db.query(sql, [customerId], (err, results) => {
    if (err) {
      console.error("Lỗi truy vấn:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống. Vui lòng thử lại",
      });
    }

    return res.json({
      success: true,
      orders: results.map((order) => ({
        orderId: order.OrderID,
        orderStatus: order.OrderStatus,
        shippingFee: order.ShippingFee,
        deliveryAddress: order.DeliveryAddress,
        orderDate: order.OrderDate,
        estimatedDeliveryTime: order.EstimatedDeliveryTime,
        actualDeliveryTime: order.ActualDeliveryTime,
        shopAddress: order.ShopAddress,
        productNames: order.ProductNames ? order.ProductNames.split(",") : [],
      })),
    });
  });
};

// Hàm getCustomerOrderDetails (đã có sẵn)
const getCustomerOrderDetails = (req, res) => {
  const orderId = req.params.orderId;
  const customerId = req.user.customerId;

  const sql = `
    SELECT 
      o.OrderID, 
      o.OrderStatus, 
      o.ShippingFee, 
      o.DeliveryAddress, 
      o.OrderDate, 
      o.EstimatedDeliveryTime, 
      o.ActualDeliveryTime, 
      o.ShopAddress,
      o.TotalAmount,
      s.ShipperID,
      s.FullName AS ShipperFullName,
      s.PhoneNumber AS ShipperPhoneNumber,
      s.VehicleType AS ShipperVehicleType,
      GROUP_CONCAT(
        JSON_OBJECT(
          'ProductName', p.ProductName,
          'Quantity', p.Quantity,
          'Price', p.Price,
          'Total', p.Total
        )
      ) AS Products
    FROM orders o
    LEFT JOIN shippers s ON o.ShipperID = s.ShipperID
    LEFT JOIN products p ON o.OrderID = p.OrderID
    WHERE o.OrderID = ? AND o.CustomerID = ?
    GROUP BY o.OrderID
  `;

  db.query(sql, [orderId, customerId], (err, results) => {
    if (err) {
      console.error("Lỗi truy vấn:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống. Vui lòng thử lại",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    const order = results[0];
    const products = order.Products ? JSON.parse(`[${order.Products}]`) : [];

    const subtotal = products.reduce((total, product) => 
      total + (product.Quantity || 0) * (product.Price || 0), 0
    );
    const totalAmount = Number(subtotal) + Number(order.ShippingFee || 0);

    return res.json({
      success: true,
      order: {
        orderId: order.OrderID,
        orderStatus: order.OrderStatus,
        shippingFee: order.ShippingFee || 0,
        deliveryAddress: order.DeliveryAddress || "Không có địa chỉ",
        orderDate: order.OrderDate,
        estimatedDeliveryTime: order.EstimatedDeliveryTime,
        actualDeliveryTime: order.ActualDeliveryTime,
        shopAddress: order.ShopAddress || "Không có địa chỉ cửa hàng",
        subtotal: subtotal,
        totalAmount: totalAmount,
        shipper: order.ShipperID
          ? {
              FullName: order.ShipperFullName,
              PhoneNumber: order.ShipperPhoneNumber,
              VehicleType: order.ShipperVehicleType,
            }
          : null,
        products: products,
      },
    });
  });
};

// API mới: Gửi đánh giá cho đơn hàng
const submitOrderRating = (req, res) => {
  const { orderId, rating, feedback } = req.body;
  const customerId = req.user.customerId;

  // Kiểm tra dữ liệu đầu vào
  if (!orderId || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng cung cấp đầy đủ thông tin và đánh giá từ 1 đến 5 sao",
    });
  }

  // Kiểm tra xem đơn hàng có tồn tại và đã giao hay không
  const checkOrderSql = `
    SELECT OrderID, OrderStatus, ShipperID 
    FROM orders 
    WHERE OrderID = ? AND CustomerID = ?
  `;
  db.query(checkOrderSql, [orderId, customerId], (err, results) => {
    if (err) {
      console.error("Lỗi truy vấn:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống. Vui lòng thử lại",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    const order = results[0];
    if (order.OrderStatus !== "Delivered") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể đánh giá đơn hàng đã giao",
      });
    }

    if (!order.ShipperID) {
      return res.status(400).json({
        success: false,
        message: "Đơn hàng không có shipper để đánh giá",
      });
    }

    // Kiểm tra xem đã có đánh giá cho đơn hàng này chưa
    const checkRatingSql = `
      SELECT RatingID 
      FROM ratings 
      WHERE OrderID = ? AND CustomerID = ?
    `;
    db.query(checkRatingSql, [orderId, customerId], (err, ratingResults) => {
      if (err) {
        console.error("Lỗi truy vấn:", err);
        return res.status(500).json({
          success: false,
          message: "Lỗi hệ thống. Vui lòng thử lại",
        });
      }

      if (ratingResults.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Bạn đã đánh giá đơn hàng này rồi",
        });
      }

      // Thêm đánh giá vào bảng ratings
      const insertRatingSql = `
        INSERT INTO ratings (ShipperID, CustomerID, OrderID, Rating, Feedback)
        VALUES (?, ?, ?, ?, ?)
      `;
      db.query(
        insertRatingSql,
        [order.ShipperID, customerId, orderId, rating, feedback || null],
        (err, result) => {
          if (err) {
            console.error("Lỗi khi thêm đánh giá:", err);
            return res.status(500).json({
              success: false,
              message: "Lỗi hệ thống. Vui lòng thử lại",
            });
          }

          return res.json({
            success: true,
            message: "Đánh giá đã được gửi thành công",
          });
        }
      );
    });
  });
};

// API mới: Lấy thông tin đánh giá của đơn hàng
const getOrderRating = (req, res) => {
  const orderId = req.params.orderId;
  const customerId = req.user.customerId;

  const sql = `
    SELECT Rating, Feedback, CreatedAt
    FROM ratings
    WHERE OrderID = ? AND CustomerID = ?
  `;
  db.query(sql, [orderId, customerId], (err, results) => {
    if (err) {
      console.error("Lỗi truy vấn:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống. Vui lòng thử lại",
      });
    }

    if (results.length === 0) {
      return res.json({
        success: true,
        rating: null,
      });
    }

    const rating = results[0];
    return res.json({
      success: true,
      rating: {
        rating: rating.Rating,
        feedback: rating.Feedback,
        createdAt: rating.CreatedAt,
      },
    });
  });
};

module.exports = { loginCustomer, getCustomerOrders, getCustomerOrderDetails, submitOrderRating, getOrderRating };