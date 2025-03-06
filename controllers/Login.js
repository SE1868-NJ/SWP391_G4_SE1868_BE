const db = require("../config/DBConnect");
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config/jwtConfig');

const loginShipper = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: "Vui lòng nhập đầy đủ email và mật khẩu" 
    });
  }

  try {
    const sql = "SELECT * FROM Shippers WHERE Email = ?";
    
    db.query(sql, [email], (err, results) => {
      if (err) {
        console.error("Lỗi truy vấn:", err);
        return res.status(500).json({ 
          success: false, 
          message: "Lỗi hệ thống. Vui lòng thử lại" 
        });
      }

      // Kiểm tra tồn tại email
      if (results.length === 0) {
        return res.status(401).json({ 
          success: false, 
          message: "Email không tồn tại" 
        });
      }

      const shipper = results[0];

      // So sánh mật khẩu trực tiếp
      if (password !== shipper.Password) {
        return res.status(401).json({ 
          success: false, 
          message: "Mật khẩu không chính xác" 
        });
      }

      // Tạo token 
      const token = jwt.sign(
        {
          shipperId: shipper.ShipperID,
          FullName: shipper.FullName,
          PhoneNumber: shipper.PhoneNumber,
          Email: shipper.Email,
          DateOfBirth: shipper.DateOfBirth,
          HouseNumber: shipper.HouseNumber,
          Ward: shipper.Ward,
          District: shipper.District, 
          City: shipper.City, 
          BankName: shipper.BankName,
          BankAccountNumber: shipper.BankAccountNumber, 
          VehicleType: shipper.VehicleType,
          LicensePlate: shipper.LicensePlate, 
          LicenseNumber: shipper.LicenseNumber, 
          RegistrationVehicle: shipper.RegistrationVehicle,
          ExpiryVehicle: shipper.ExpiryVehicle,
          LicenseExpiryDate: shipper.LicenseExpiryDate, 
          DriverLicenseImage: shipper.DriverLicenseImage, 
          VehicleRegistrationImage: shipper.VehicleRegistrationImage, 
          ImageShipper: shipper.ImageShipper,
          CitizenID: shipper.CitizenID, 
          Status: shipper.Status, 
          TotalRatings: shipper.TotalRatings,
          AverageRating: shipper.AverageRating, 
          BonusAmount: shipper.BonusAmount, 
          LastBonusDate: shipper.LastBonusDate,
          IDCardImage: shipper.IDCardImage, 
          CancelReason: shipper.CancelReason, 
          CancelTime: shipper.CancelTime, 
          TempPhoneNumber: shipper.TempPhoneNumber,
          TempEmail: shipper.TempEmail,
          TempWard: shipper.TempWard,
          TempDistrict: shipper.TempDistrict,
          TempCity: shipper.TempCity, 
          TempBankName: shipper.TempBankName, 
          TempBankAccountNumber: shipper.TempBankAccountNumber, 
          TempVehicleType: shipper.TempVehicleType, 
          TempLicensePlate: shipper.TempLicensePlate, 
          TempRegistrationVehicle: shipper.TempRegistrationVehicle, 
          TempExpiryVehicle: shipper.TempExpiryVehicle, 
          TempVehicleRegistrationImage: shipper.TempVehicleRegistrationImage, 
          TempImageShipper: shipper.TempImageShipper, 
        },
        SECRET_KEY, 
        { expiresIn: '1h' } 
      );

      switch (shipper.Status) {
        case 'Active':
          return res.json({
            success: true,
            token: token,
            shipper: {
              ShipperID: shipper.ShipperID,
              FullName: shipper.FullName,
              Email: shipper.Email,
              Status: shipper.Status
            }
          });
        
        case 'PendingRegister':
          return res.status(403).json({ 
            success: false, 
            message: "Tài khoản của bạn đang chờ duyệt" 
          });
        
        case 'Inactive':
          return res.status(403).json({ 
            success: false, 
            message: "Tài khoản của bạn đã bị vô hiệu hóa" 
          });
        
        default:
          return res.status(403).json({ 
            success: false, 
            message: "Trạng thái tài khoản không hợp lệ" 
          });
      }
    });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    res.status(500).json({ 
      success: false, 
      message: "Lỗi hệ thống. Vui lòng thử lại" 
    });
  }
};

module.exports = { loginShipper };