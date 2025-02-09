const express = require("express");
const cors = require("cors");
const { getShippers, addShipper, getShipperById } = require("./controllers/manageshipper");
const { loginShipper } = require("./controllers/Login");
const { getOrders, changeStatusOrder } = require("./controllers/order");
const { submitContact, getContacts } = require("./controllers/contactController");

const app = express();

app.use(cors({
  origin: "http://localhost:3000", 
  credentials: true,
  methods: ["GET", "POST"], 
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

app.get("/api/shippers", getShippers);

app.post("/api/shippers", addShipper);

app.post("/api/login", loginShipper);

app.get("/api/getOrders",getOrders);

app.get("/api/getShipperById", getShipperById);

app.post("/api/changeStatusOrder", changeStatusOrder);
app.post("/api/contact/submit", submitContact);
app.get("/api/contact/list", getContacts);
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});