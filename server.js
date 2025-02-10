const express = require("express");
const cors = require("cors");
const {getApprovedShippers,getPendingShippers,approveShipper,rejectShipper,updateShipper} = require("./controllers/ManageShipper");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API: Lấy danh sách shipper đã được duyệt
app.get("/api/approved-shippers", getApprovedShippers);

// API: Lấy danh sách shipper đang chờ duyệt
app.get("/api/pending-shippers", getPendingShippers);

// API: Duyệt shipper
app.post("/api/approve-shipper", approveShipper);

// API: Từ chối shipper
app.post("/api/reject-shipper", rejectShipper);

// API: Update thông tin shipper
app.put("/api/update-shippers", updateShipper);

// Chạy server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});