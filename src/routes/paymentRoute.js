const express = require("express");
const router = express.Router();

const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
    getRazorpayKey,
    createSubscription,
    verifySubscription,
    getPaymentRecords,
    cancelSubscription
} = require("../controllers/payment.controller");

router.get("/razorpay-key", protect, getRazorpayKey);
router.post("/subscribe", protect, createSubscription);
router.post("/verify", protect, verifySubscription);
router.get("/", protect, adminOnly, getPaymentRecords);
router.post("/unsubscribe", protect, cancelSubscription);

module.exports = router;
