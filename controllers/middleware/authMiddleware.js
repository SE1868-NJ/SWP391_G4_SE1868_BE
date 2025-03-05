const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../../config/jwtConfig');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('Authorization Header:', authHeader);
  console.log('Extracted Token:', token);

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Không tìm thấy token' 
    });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    
    console.log('Decoded Token:', decoded);
    
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token Verification Error:', err);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token đã hết hạn' 
      });
    }

    return res.status(403).json({ 
      success: false, 
      message: 'Token không hợp lệ' 
    });
  }
};

module.exports = { authenticateToken };