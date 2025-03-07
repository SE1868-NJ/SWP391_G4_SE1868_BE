const db = require("../config/DBConnect");

const getReports = (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM incidentreports WHERE ReportID = ?', [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result[0]);
  });
};

module.exports = { getReports };