const winston = require("winston");
const mongoose = require("mongoose");
const requestContext = require("./RequestContext.js"); // adjust path

/**
 * Logger class for structured logging with Winston and MongoDB.
 * It supports different log levels and stores logs in a MongoDB collection.
 * It also formats logs with timestamps and colors for console output.
 * @class Logger
 * @property {mongoose.Connection} logDatabase - The MongoDB connection to use for logging.
 * @property {mongoose.Schema} logSchema - The schema for the log entries.
 * @property {mongoose.Model} logModel - The Mongoose model for the log entries.
 * @property {winston.Logger} logger - The Winston logger instance.
 * @property {winston.Logform.Format} customFormat - Custom format for log messages.
 * @example
 * const { Logger } = require('./utils/Logger');
 * const logger = new Logger(mongoConnection);
 * logger.info('This is an info message');
 * logger.warn('This is a warning message');
 * logger.error('This is an error message');
 * @throws {Error} If the MongoDB connection fails or if logging to the database fails.
 */
class Logger {
    // Declare private fields
    #logDatabase;
    #logSchema;
    #logModel;
    #customFormat;
    #logger;

    constructor(logDatabase) {
        this.#logDatabase = logDatabase;

        // Define private schema
        this.#logSchema = new mongoose.Schema({
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

        // Attach model to provided DB connection
        this.#logModel = this.#logDatabase.model("Logs", this.#logSchema);

        // Setup log format
        this.#customFormat = winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        });

        // Initialize internal winston logger
        this.#initLogger();
    }

    // Private: setup Winston instance
    #initLogger() {
        this.#logger = winston.createLogger({
            level: "info",
            format: winston.format.combine(winston.format.timestamp(), this.#customFormat),
            transports: [
                new winston.transports.File({
                    filename: "public/application.log",
                    level: "error"
                }),
                new winston.transports.Console({
                    level: "info",
                    format: winston.format.combine(winston.format.colorize(), winston.format.timestamp(), this.#customFormat)
                })
            ]
        });
    }

    // Private: core logging logic
    #log(message, level = "info") {
        const ctx = requestContext.get() || {};

        const prefixedMessage = `[${ctx.requestId || "NO-ID"}] ${message}`;
        this.#logger.log({ level, message: prefixedMessage });

        // Save to DB asynchronously
        this.#logModel
            .create({
                requestId: ctx.requestId,
                service: ctx.service,
                userId: ctx.userId,
                ip: ctx.ip,
                userAgent: ctx.userAgent,
                method: ctx.method,
                url: ctx.url,
                level,
                message,
                timestamp: new Date()
            })
            .catch(err => {
                this.#logger.error(`Failed to log to DB: ${err.message}`);
            });
    }

    // Public methods
    info(message) {
        this.#log(message, "info");
    }

    warn(message) {
        this.#log(message, "warn");
    }

    error(message) {
        this.#log(message, "error");
    }
}

module.exports = { Logger };
