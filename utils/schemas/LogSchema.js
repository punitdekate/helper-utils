const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
    requestId: { type: String, required: true, index: true },
    service: { type: String, required: true, index: true },
    userId: { type: String, default: null },
    ip: String,
    userAgent: String,
    method: String,
    url: String,
    level: { type: String, enum: ["info", "warn", "error"], default: "info" },
    message: String,
    timestamp: { type: Date, default: Date.now }
});

const LogModel = mongoose.model("Logs", logSchema);
module.exports = LogModel;
