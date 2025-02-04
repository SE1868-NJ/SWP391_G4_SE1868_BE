const express = require("express");
const cors = require("cors");
const { getShippers, addShipper } = require("./controllers/manageshipper");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API: Lấy danh sách shipper
app.get("/api/shippers", getShippers);

// API: Thêm shipper mới
app.post("/api/shippers", addShipper);

// Chạy server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});