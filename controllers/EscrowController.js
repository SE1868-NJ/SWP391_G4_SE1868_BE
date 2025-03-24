const db = require("../config/DBConnect");
const axios = require("axios");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config/jwtConfig"); // Đảm bảo bạn đã cấu hình SECRET_KEY

// Middleware xác thực token
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "Không có token" });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: "Token không hợp lệ" });
    }
    req.user = user; // Gán thông tin user (bao gồm shipperId) vào req
    next();
  });
};

// Lấy số dư ví Escrow
const getEscrowBalance = async (req, res) => {
  try {
    const shipperId = req.user.shipperId;

    const checkEscrowQuery = `SELECT Escrow FROM EWallet WHERE ShipperID = ?`;
    db.query(checkEscrowQuery, [shipperId], (err, results) => {
      if (err) {
        console.error("Error checking wallet:", err);
        return res.status(500).json({ success: false, message: "Lỗi khi kiểm tra ví" });
      }

      const escrowBalance = results.length > 0 ? results[0].Escrow : 0;
      res.status(200).json({
        success: true,
        data: { escrowBalance },
      });
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Nạp tiền vào ví Escrow
const depositToEscrow = async (req, res) => {
  try {
    const { amount, isManualUpdate = false } = req.body;
    const shipperId = req.user.shipperId;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Số tiền hợp lệ là bắt buộc",
      });
    }

    db.beginTransaction((err) => {
      if (err) {
        console.error("Error starting transaction:", err);
        return res.status(500).json({ success: false, message: "Lỗi khi bắt đầu giao dịch" });
      }

      const checkEscrowQuery = `SELECT Escrow FROM EWallet WHERE ShipperID = ?`;
      db.query(checkEscrowQuery, [shipperId], (err, walletResults) => {
        if (err) {
          return db.rollback(() => {
            console.error("Error checking wallet:", err);
            res.status(500).json({ success: false, message: "Lỗi khi kiểm tra ví" });
          });
        }

        if (walletResults.length === 0) {
          const createWalletQuery = `INSERT INTO EWallet (ShipperID, Escrow, Balance, LastUpdated) VALUES (?, 0, 0, NOW())`;
          db.query(createWalletQuery, [shipperId], (err) => {
            if (err) {
              return db.rollback(() => {
                console.error("Error creating wallet:", err);
                res.status(500).json({ success: false, message: "Lỗi khi tạo ví mới" });
              });
            }
            proceedWithDeposit(0);
          });
        } else {
          proceedWithDeposit(walletResults[0].Escrow);
        }
      });

      const proceedWithDeposit = (currentEscrow) => {
        if (!isManualUpdate) {
          const momoConfig = {
            accessKey: "F8BBA842ECF85",
            secretKey: "K951B6PE1waDMi640xX08PD3vg6EkVlz",
            partnerCode: "MOMO",
            redirectUrl: "http://localhost:3000/escrow-deposit",
            ipnUrl: "http://localhost:5000/api/momo-ipn",
            lang: "vi",
          };

          const orderId = `${momoConfig.partnerCode}${Date.now()}`;
          const requestId = orderId;
          const orderInfo = `Nạp ${amount} VNĐ vào ví ký quỹ`;
          const extraData = Buffer.from(JSON.stringify({ depositAmount: amount })).toString("base64");
          const momoParams = {
            accessKey: momoConfig.accessKey,
            amount: amount.toString(),
            extraData,
            ipnUrl: momoConfig.ipnUrl,
            orderId,
            orderInfo,
            partnerCode: momoConfig.partnerCode,
            redirectUrl: momoConfig.redirectUrl,
            requestId,
            requestType: "captureWallet",
          };

          const rawSignature = Object.entries(momoParams)
            .map(([key, value]) => `${key}=${value}`)
            .sort()
            .join("&");
          const signature = crypto.createHmac("sha256", momoConfig.secretKey).update(rawSignature).digest("hex");

          const requestBody = {
            ...momoParams,
            partnerName: "EscrowApp",
            storeId: "EscrowTestStore",
            lang: momoConfig.lang,
            signature,
          };

          axios
            .post("https://test-payment.momo.vn/v2/gateway/api/create", requestBody, {
              headers: { "Content-Type": "application/json" },
            })
            .then((response) => {
              if (response.data.resultCode === 0) {
                res.status(200).json({ success: true, payUrl: response.data.payUrl });
              } else {
                res.status(400).json({
                  success: false,
                  message: response.data.message || "Lỗi khi khởi tạo thanh toán MoMo",
                });
              }
            })
            .catch((error) => {
              console.error("MoMo request error:", error);
              res.status(500).json({
                success: false,
                message: "Lỗi khi gửi yêu cầu thanh toán MoMo",
              });
            });
        } else {
          const newEscrowBalance = Number(currentEscrow) + Number(amount);
          const updateEscrowQuery = `UPDATE EWallet SET Escrow = ?, LastUpdated = NOW() WHERE ShipperID = ?`;
          db.query(updateEscrowQuery, [newEscrowBalance, shipperId], (err) => {
            if (err) {
              return db.rollback(() => {
                console.error("Error updating escrow:", err);
                res.status(500).json({ success: false, message: "Lỗi khi cập nhật ví ký quỹ" });
              });
            }

            db.commit((err) => {
              if (err) {
                return db.rollback(() => {
                  console.error("Error committing transaction:", err);
                  res.status(500).json({ success: false, message: "Lỗi khi hoàn tất giao dịch" });
                });
              }

              res.status(200).json({
                success: true,
                data: { newEscrowBalance },
              });
            });
          });
        }
      };
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Cập nhật trạng thái shipper
const updateShipperStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const shipperId = req.user.shipperId;

    const updateStatusQuery = `UPDATE Shippers SET Status = ? WHERE ShipperID = ?`;
    db.query(updateStatusQuery, [status, shipperId], (err, results) => {
      if (err) {
        console.error("Error updating status:", err);
        return res.status(500).json({ success: false, message: "Lỗi khi cập nhật trạng thái" });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Không tìm thấy shipper" });
      }

      res.status(200).json({ success: true, message: "Cập nhật trạng thái thành công" });
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Export các hàm với middleware áp dụng
module.exports = {
  getEscrowBalance: [authenticateToken, getEscrowBalance],
  depositToEscrow: [authenticateToken, depositToEscrow],
  updateShipperStatus: [authenticateToken, updateShipperStatus],
};