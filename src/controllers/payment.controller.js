const crypto = require("crypto");
const Razorpay = require("razorpay");
const User = require("../models/user.model");

const getRazorpayClient = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return null;
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const DEFAULT_PAYMENT_AMOUNT = Number(process.env.SUBSCRIPTION_AMOUNT || 49900);

const getRazorpayKey = async (req, res) => {
  try {
    if (!process.env.RAZORPAY_KEY_ID) {
      return res.status(500).json({
        success: false,
        message: "Razorpay key not configured",
      });
    }

    return res.status(200).json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error fetching Razorpay key",
      error: error.message,
    });
  }
};

const createSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const razorpay = getRazorpayClient();
    if (!razorpay) {
      return res.status(500).json({
        success: false,
        message: "Razorpay credentials are not configured",
      });
    }

    const amountInPaise = Number(req.body?.amount || DEFAULT_PAYMENT_AMOUNT);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${user._id}_${Date.now()}`,
      notes: {
        userId: String(user._id),
        email: user.email,
      },
    });

    return res.status(200).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      message: "Order created successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error creating Razorpay order",
      error: error.message,
    });
  }
};

const verifySubscription = async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      courseId,
    } = req.body || {};

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay payment data",
      });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isValid = generatedSignature === razorpay_signature;

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.subscription = {
      status: "active",
      razorpaySubscriptionId: razorpay_order_id,
      updatedAt: new Date(),
    };

    if (courseId) {
      const enrolledCourseIds =
        user.enrolledCourses?.map((id) => id.toString()) || [];
      if (!enrolledCourseIds.includes(courseId.toString())) {
        user.enrolledCourses.push(courseId);
      }
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: {
        enrolledCourseId: courseId || null,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error verifying payment",
      error: error.message,
    });
  }
};

const getPaymentRecords = async (req, res) => {
  try {
    const users = await User.find({ "subscription.status": "active" }).select(
      "name email subscription",
    );

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error fetching payment records",
      error: error.message,
    });
  }
};

const cancelSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.subscription = {
      status: "inactive",
      razorpaySubscriptionId: null,
      updatedAt: new Date(),
    };

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Subscription cancelled successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error cancelling subscription",
      error: error.message,
    });
  }
};

module.exports = {
  getRazorpayKey,
  createSubscription,
  verifySubscription,
  getPaymentRecords,
  cancelSubscription,
};
