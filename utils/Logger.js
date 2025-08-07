"use strict";
const winston = require("winston");
const requestContext = require("./RequestContext.js");
const LogModel = require("./schemas/LogSchema.js");

// Custom format for the logs
const customFormat = winston.format.printf(({ timestamp, level, message }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

/**
 * Logger - A custom logger using Winston for logging messages with different transports.
 * @description This logger is configured to log error messages to a file and info messages to the console.
 * It uses a custom format that includes timestamps and log levels.
 * The logger can be used throughout the application to log messages at different levels (info, warn, error).
 * @example
 * const { Logger } = require('./utils/Logger');
 * Logger.info('This is an info message');
 * Logger.error('This is an error message');
 */
// Create a logger with different transports for error and info
const Logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(winston.format.timestamp(), customFormat),
    transports: [
        // Logs errors to a file
        new winston.transports.File({
            filename: "public/application.log",
            level: "error"
        }),
        // Logs info and above to the console
        new winston.transports.Console({
            level: "info",
            format: winston.format.combine(
                winston.format.colorize(), // Adds color to console logs
                winston.format.timestamp(),
                customFormat
            )
        })
    ]
});

/**
 * log - A function to log messages with context information.
 * @param {string} message - The message to log.
 * @param {string} [level="info"] - The log level (info, warn, error).
 * @description This function retrieves the current request context using AsyncLocalStorage,
 * prefixes the message with the request ID, and logs it using Winston.
 * It also logs the message to a MongoDB collection using Mongoose for persistent storage.
 * * @example
 * const { log } = require('helper-utils');
 * log('This is an info message', 'info');
 * log('This is a warning message', 'warn');
 * log('This is an error message', 'error');
 * * @returns {void}
 * @throws {Error} If there is an error while logging to the database.
 */
const log = (message, level = "info") => {
    const ctx = requestContext.get();

    const prefixedMessage = `[${ctx.requestId || "NO-ID"}] ${message}`;
    Logger.log({ level, message: prefixedMessage });
    
    // Non-blocking DB logging
    LogModel.create({
        requestId: ctx.requestId,
        userId: ctx.userId,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        method: ctx.method,
        url: ctx.url,
        level,
        message,
        timestamp: new Date()
    }).catch(err => {
        Logger.error(`Failed to log to DB: ${err.message}`);
    });
};

module.exports = { Logger, log };
