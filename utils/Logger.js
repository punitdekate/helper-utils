"use strict";
const winston = require("winston");
const mongoose = require("mongoose");
const { DB_URL } = require("../constants");
require("winston-mongodb");

/**
 * Self-initializing Universal Logger
 * Automatically configures itself based on environment variables
 * Works immediately upon import with console logging
 * Auto-connects to MongoDB if DB_LOG_URL is provided
 */
class UniversalLogger {
    #logger;
    #mongoConnection;
    #isInitializing = false;
    #isInitialized = false;
    #initPromise = null;
    #serviceName;

    constructor(serviceName = "Logs") {
        this.#serviceName = serviceName;
        this.#initConsoleLogger();
        this.#autoInitDatabase();
    }

    #initConsoleLogger() {
        const customFormat = winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        });

        this.#logger = winston.createLogger({
            level: process.env.LOG_LEVEL || "info",
            format: winston.format.combine(winston.format.timestamp(), customFormat),
            transports: [
                new winston.transports.File({
                    filename: "public/application.log",
                    level: "error"
                }),
                new winston.transports.Console({
                    level: process.env.LOG_LEVEL || "info",
                    format: winston.format.combine(winston.format.colorize(), winston.format.timestamp(), customFormat)
                })
            ]
        });
    }

    async #autoInitDatabase() {
        if (this.#initPromise) {
            return this.#initPromise;
        }

        if (this.#isInitialized || this.#isInitializing) {
            return;
        }

        const mongoUri = DB_URL;
        if (!mongoUri) {
            return;
        }

        this.#initPromise = this.#performDatabaseInit(mongoUri, this.#serviceName);
        return this.#initPromise;
    }

    async #performDatabaseInit(mongoUri, serviceName) {
        if (this.#isInitializing || this.#isInitialized) {
            return;
        }

        this.#isInitializing = true;

        try {
            if (this.#mongoConnection && this.#mongoConnection.readyState === 1) {
                return;
            }

            this.#mongoConnection = mongoose.createConnection(mongoUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });

            await this.#mongoConnection.asPromise();

            if (!this.#isInitialized) {
                this.#reconfigureWithDatabase(serviceName);
                this.#isInitialized = true;

                // Use console.log instead of this.info to avoid recursion
                console.log(`Logger initialized for service: ${serviceName} with MongoDB`);
            }
        } catch (error) {
            this.#initConsoleLogger();
            console.warn(`Failed to initialize database logging: ${error.message}`);
        } finally {
            this.#isInitializing = false;
        }
    }

    #reconfigureWithDatabase(serviceName) {
        if (this.#logger) {
            this.#logger.clear();
            this.#logger.close();
        }

        const customFormat = winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        });

        const transports = [
            new winston.transports.File({ filename: "public/application.log", level: "error" }),
            new winston.transports.MongoDB({
                db: this.#mongoConnection,
                collection: `${serviceName}_logs`,
                level: process.env.LOG_LEVEL || "info",
                options: { useUnifiedTopology: true },
                format: winston.format.combine(winston.format.timestamp(), winston.format.json())
            })
        ];

        this.#logger = winston.createLogger({
            level: process.env.LOG_LEVEL || "info",
            format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
            transports
        });
    }

    #getContext() {
        let ctx = {};
        try {
            if (global.requestContext && typeof global.requestContext.get === "function") {
                ctx = global.requestContext.get() || {};
            }
            if (global.cls && typeof global.cls.getNamespace === "function") {
                const namespace = global.cls.getNamespace("request");
                ctx = namespace ? namespace.active : {};
            }
        } catch (err) {
            ctx = {};
        }
        return ctx;
    }

    #log(level, message, meta = {}) {
        const context = this.#getContext();

        const logData = {
            message,
            requestId: context.requestId || "NO-REQ",
            userId: context.userId || null,
            ip: context.ip || null,
            userAgent: context.userAgent || null,
            method: context.method || null,
            url: context.url || null,
            service: context.service || this.#serviceName || process.env.SERVICE_NAME || "app",
            ...meta
        };

        this.#logger.log(level, message, logData);
    }

    info(message, meta = {}) {
        this.#log("info", message, meta);
    }

    warn(message, meta = {}) {
        this.#log("warn", message, meta);
    }

    error(message, meta = {}) {
        this.#log("error", message, meta);
    }

    debug(message, meta = {}) {
        this.#log("debug", message, meta);
    }

    async close() {
        if (this.#mongoConnection) {
            await this.#mongoConnection.close();
        }
        if (this.#logger) {
            this.#logger.close();
        }
    }
}

// ===== FIXED SINGLETON IMPLEMENTATION =====
const loggerInstances = new Map();

function getLoggerInstance(serviceName = "Logs") {
    if (!loggerInstances.has(serviceName)) {
        loggerInstances.set(serviceName, new UniversalLogger(serviceName));
    }
    return loggerInstances.get(serviceName);
}

function createLogger(serviceName = "Logs") {
    // For createLogger, always return the same instance for the same service name
    return getLoggerInstance(serviceName);
}

// Export with proper singleton
module.exports = {
    logger: getLoggerInstance("Logs"), // Default logger
    createLogger // Factory function
};
