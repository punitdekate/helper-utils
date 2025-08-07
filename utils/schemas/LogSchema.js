"use strict";
const mongoose = require("mongoose");
let LogModel;
const LogSchema = new mongoose.Schema({
    requestId: { type: String, required: true, index: true },
    userId: { type: String, default: null },
    ip: String,
    userAgent: String,
    method: String,
    url: String,
    level: { type: String, enum: ["info", "warn", "error"], default: "info" },
    message: String,
    timestamp: { type: Date, default: Date.now }
});

// Function to get/create a model for a given table name
const AssignLogTableName = logTable => {
    if (mongoose.models[logTable]) {
        LogModel = mongoose.model(logTable);
    }
    LogModel = mongoose.model(logTable, LogSchema);
};

module.exports = { LogModel, AssignLogTableName };
