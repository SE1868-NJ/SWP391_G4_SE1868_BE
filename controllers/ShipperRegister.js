import db from "../config/DBConnect.js";
import bcrypt from "bcryptjs";
const addShipper = async (req, res) => {
  try {
    const {
      FullName,
      PhoneNumber,
      Email,
      DateOfBirth,
      HouseNumber,
      Ward,
      District,
      City,
      BankName,
      BankAccountNumber,
      VehicleType,
      LicensePlate,
      LicenseNumber,
      RegistrationVehicle,
      ExpiryVehicle,
      LicenseExpiryDate,
      CitizenID,
      Password,
      DriverLicenseImage,
      VehicleRegistrationImage,
      ImageShipper,
      IDCardImage
    } = req.body;

    // Log để debug
    console.log('Received data:', req.body);

    // Validate required fields
    const requiredFields = {
      FullName,
      PhoneNumber,
      CitizenID,
      Password
    };
    
    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([field]) => field);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Thiếu thông tin bắt buộc: ${missingFields.join(', ')}`
      });
    }

    // Validate phone number format
    if (!/^(0[0-9]{9})$/.test(PhoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại không hợp lệ'
      });
    }

    // Validate CitizenID format
    if (!/^[0-9]{12}$/.test(CitizenID)) {
      return res.status(400).json({
        success: false,
        message: 'Số CCCD không hợp lệ'
      });
    }

    // Check for existing phone number
    const [phoneExists] = await db.promise().query(
      'SELECT COUNT(*) as count FROM Shippers WHERE PhoneNumber = ?',
      [PhoneNumber]
    );

    if (phoneExists[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại đã được đăng ký'
      });
    }

    // Check for existing CitizenID
    const [citizenIdExists] = await db.promise().query(
      'SELECT COUNT(*) as count FROM Shippers WHERE CitizenID = ?',
      [CitizenID]
    );

    if (citizenIdExists[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Số CCCD đã được đăng ký'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(Password, 10);

    const query = `
      INSERT INTO Shippers (
        FullName, PhoneNumber, Email, DateOfBirth,
        HouseNumber, Ward, District, City,
        BankName, BankAccountNumber, VehicleType,
        LicensePlate, LicenseNumber, RegistrationVehicle,
        ExpiryVehicle, LicenseExpiryDate, CitizenID,
        Status, Password, DriverLicenseImage,
        VehicleRegistrationImage, ImageShipper,
        IDCardImage, TotalRatings
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      FullName,
      PhoneNumber,
      Email || null,
      DateOfBirth || null,
      HouseNumber || null,
      Ward || null,
      District || null,
      City || null,
      BankName || null,
      BankAccountNumber || null,
      VehicleType || null,
      LicensePlate || null,
      LicenseNumber || null,
      RegistrationVehicle || null,
      ExpiryVehicle || null,
      LicenseExpiryDate || null,
      CitizenID,
      'PendingRegister',
      hashedPassword,
      DriverLicenseImage || null,
      VehicleRegistrationImage || null,
      ImageShipper || null,
      IDCardImage || null,
      0
    ];

    const [result] = await db.promise().query(query, values);

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công! Vui lòng đợi xác nhận.',
      shipperId: result.insertId
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      message: error.code === 'ER_DUP_ENTRY' 
        ? 'Thông tin đã tồn tại trong hệ thống'
        : 'Lỗi server'
    });
  }
};
export { addShipper };