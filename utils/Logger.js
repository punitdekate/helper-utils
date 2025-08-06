"use strict";
const winston = require("winston");

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

module.exports = { Logger };
