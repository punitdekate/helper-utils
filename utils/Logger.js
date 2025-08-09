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
    #initPromise = null; // Track initialization promise

    constructor() {
        // Start with console-only logger immediately
        this.#initConsoleLogger();

        // Auto-initialize database logging if env vars are available
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
                new winston.transports.Console({
                    level: process.env.LOG_LEVEL || "info",
                    format: winston.format.combine(winston.format.colorize(), winston.format.timestamp(), customFormat)
                })
            ]
        });
    }

    async #autoInitDatabase() {
        // Return existing promise if already initializing/initialized
        if (this.#initPromise) {
            return this.#initPromise;
        }

        // Skip if already initialized or currently initializing
        if (this.#isInitialized || this.#isInitializing) {
            return;
        }

        const mongoUri = DB_URL;
        const serviceName = "Logs";

        if (!mongoUri) {
            // No database config, stay with console-only logging
            return;
        }

        // Create and store the initialization promise
        this.#initPromise = this.#performDatabaseInit(mongoUri, serviceName);
        return this.#initPromise;
    }

    async #performDatabaseInit(mongoUri, serviceName) {
        this.#isInitializing = true;

        try {
            // Check if connection already exists and is connected
            if (this.#mongoConnection && this.#mongoConnection.readyState === 1) {
                return;
            }

            // Create MongoDB connection
            this.#mongoConnection = mongoose.createConnection(mongoUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });

            await this.#mongoConnection.asPromise();

            // Only reconfigure if not already configured
            if (!this.#isInitialized) {
                this.#reconfigureWithDatabase(serviceName);
                this.#isInitialized = true;

                // Log success message only once
                this.info(`Logger initialized for service: ${serviceName} with MongoDB`);
            }
        } catch (error) {
            // Silently fall back to console-only logging
            this.#initConsoleLogger();
            console.warn(`Failed to initialize database logging: ${error.message}`);
        } finally {
            this.#isInitializing = false;
        }
    }

    #reconfigureWithDatabase(serviceName) {
        // Clear existing transports
        this.#logger.clear();

        const customFormat = winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        });

        const transports = [
            // Console transport
            new winston.transports.Console({
                level: process.env.LOG_LEVEL || "info",
                format: winston.format.combine(winston.format.colorize(), winston.format.timestamp(), customFormat)
            }),
            // MongoDB transport
            new winston.transports.MongoDB({
                db: this.#mongoConnection,
                collection: `${serviceName}_logs`,
                level: process.env.LOG_LEVEL || "info",
                options: { useUnifiedTopology: true },
                format: winston.format.combine(winston.format.timestamp(), winston.format.json())
            })
        ];

        // Add file transport if LOG_FILE is specified
        if (process.env.LOG_FILE) {
            transports.push(
                new winston.transports.File({
                    filename: process.env.LOG_FILE,
                    level: "error"
                })
            );
        }

        this.#logger = winston.createLogger({
            level: process.env.LOG_LEVEL || "info",
            format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
            transports
        });
    }

    #getContext() {
        let ctx = {};
        try {
            // Try to get request context from common patterns
            if (global.requestContext && typeof global.requestContext.get === "function") {
                ctx = global.requestContext.get() || {};
            }
            if (global.cls && typeof global.cls.getNamespace === "function") {
                const namespace = global.cls.getNamespace("request");
                ctx = namespace ? namespace.active : {};
            }
        } catch (err) {
            // No context available, continue with empty context
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
            service: context.service || process.env.SERVICE_NAME || process.env.npm_package_name || "app",
            ...meta
        };

        this.#logger.log(level, message, logData);
    }

    // Public logging methods
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

// Create singleton instance - ensure only one instance exists
let loggerInstance = null;

function getLoggerInstance() {
    if (!loggerInstance) {
        loggerInstance = new UniversalLogger();
    }
    return loggerInstance;
}

// Export the singleton logger instance
module.exports = { logger: getLoggerInstance() };
