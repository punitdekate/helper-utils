"use strict";
const winston = require("winston");
const mongoose = require("mongoose");
const { DB_URL } = require("../constants");
require("winston-mongodb");

/**
 * Self-initializing Universal Logger - TRUE SINGLETON
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
        
        // Delay database init to avoid multiple simultaneous attempts
        setTimeout(() => this.#autoInitDatabase(), 100);
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
        // Multiple protection layers
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

        // Set flag immediately to prevent other instances
        this.#isInitializing = true;
        this.#initPromise = this.#performDatabaseInit(mongoUri, this.#serviceName);
        
        try {
            await this.#initPromise;
        } catch (error) {
            this.#initPromise = null; // Reset on failure
        }
    }

    async #performDatabaseInit(mongoUri, serviceName) {
        try {
            // Check if already connected
            if (this.#mongoConnection && this.#mongoConnection.readyState === 1) {
                return;
            }

            // Create connection with timeout settings
            this.#mongoConnection = mongoose.createConnection(mongoUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                connectTimeoutMS: 10000,  // Reduced timeout
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000
            });

            await this.#mongoConnection.asPromise();

            if (!this.#isInitialized) {
                this.#reconfigureWithDatabase(serviceName);
                this.#isInitialized = true;
                
                // Use console.log to avoid recursion
                console.log(`Logger initialized for service: ${serviceName} with MongoDB`);
            }

        } catch (error) {
            console.warn(`Database logging unavailable: ${error.message}`);
            // Keep console-only logging
        } finally {
            this.#isInitializing = false;
        }
    }

    #reconfigureWithDatabase(serviceName) {
        if (this.#logger) {
            this.#logger.clear();
        }

        const customFormat = winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        });

        const transports = [
            new winston.transports.File({
                filename: "public/application.log",
                level: "error"
            }),
            new winston.transports.Console({
                level: process.env.LOG_LEVEL || "info",
                format: winston.format.combine(winston.format.colorize(), winston.format.timestamp(), customFormat)
            }),
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
            service: context.service || this.#serviceName,
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
    }
}

// ===== GLOBAL SINGLETON REGISTRY =====
// Use global to ensure singleton across ALL requires
if (!global.__loggerInstances) {
    global.__loggerInstances = new Map();
}

function getLoggerInstance(serviceName = "Logs") {
    if (!global.__loggerInstances.has(serviceName)) {
        global.__loggerInstances.set(serviceName, new UniversalLogger(serviceName));
    }
    return global.__loggerInstances.get(serviceName);
}

function createLogger(serviceName = "Logs") {
    return getLoggerInstance(serviceName);
}

// Export singleton
module.exports = {
    logger: getLoggerInstance("Logs"),
    createLogger
};
