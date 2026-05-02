const mongoose = require("mongoose");

const blacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true
    }
}, {
    timestamps: true
});

// Automatically remove token from DB after 7 days (matching JWT expiry)
blacklistSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

const Blacklist = mongoose.model("Blacklist", blacklistSchema);
module.exports = Blacklist;
