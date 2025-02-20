const db = require("../config/DBConnect");

const getShippers = (req, res) => {
  const sql = "SELECT * FROM shippers";
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching shippers:', err);
      return res.status(500).json({ 
        success: false, 
        message: "Server error retrieving shippers" 
      });
    }
    res.json(results);
  });
};

const addShipper = (req, res) => {
  const { 
    FullName, 
    PhoneNumber, 
    Email, 
    DateOfBirth, 
    Address, 
    BankAccountNumber, 
    VehicleDetails, 
    Status = "Active" 
  } = req.body;

  const sql = `
    INSERT INTO Shippers (
      FullName, 
      PhoneNumber, 
      Email, 
      DateOfBirth, 
      Address, 
      BankAccountNumber, 
      VehicleDetails, 
      Status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql, 
    [
      FullName, 
      PhoneNumber, 
      Email, 
      DateOfBirth, 
      Address, 
      BankAccountNumber, 
      VehicleDetails, 
      Status
    ], 
    (err, result) => {
      if (err) {
        console.error('Error adding shipper:', err);
        return res.status(500).json({ 
          success: false, 
          message: "Failed to add shipper" 
        });
      }
      
      res.status(201).json({ 
        success: true,
        message: "Shipper added successfully!", 
        ShipperID: result.insertId 
      });
    }
  );
};

const getShipperById = (req, res) => {
  const ShipperID = req.query.id;

  // Validate input
  if (!ShipperID) {
    return res.status(400).json({ 
      success: false, 
      message: "ShipperID is required" 
    });
  }

  const sql = "SELECT * FROM shippers WHERE ShipperID = ?";
  
  db.query(sql, [ShipperID], (err, results) => {
    if (err) {
      console.error('Database error fetching shipper:', err);
      return res.status(500).json({ 
        success: false, 
        message: "Server error retrieving shipper" 
      });
    }

    if (results.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Shipper not found" 
      });
    }

    // Remove sensitive information before sending
    const { Password, ...shipperData } = results[0];
    
    res.json({
      success: true,
      shipper: shipperData
    });
  });
};

module.exports = { 
  getShippers, 
  addShipper, 
  getShipperById 
};
