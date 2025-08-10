"use strict";
const mongoose = require("mongoose");
const fs = require("fs").promises;
const path = require("path");
const { DB_URL } = require("../constants");

/**
 * Custom Universal Logger - No external dependencies
 * Only uses mongoose for database logging
 */
class UniversalLogger {
    #mongoConnection;
    #logModel;
    #isInitializing = false;
    #isInitialized = false;
    #initPromise = null;
    #serviceName;

    // Console colors
    #colors = {
        info: "\x1b[36m", // cyan
        warn: "\x1b[33m", // yellow
        error: "\x1b[31m", // red
        debug: "\x1b[90m", // gray
        reset: "\x1b[0m" // reset
    };

    constructor(serviceName = "Logs") {
        this.#serviceName = serviceName;

        // Auto-initialize database
        setTimeout(() => this.#autoInitDatabase(), 100);
    }

    // Format timestamp
    #getTimestamp() {
        return new Date().toISOString();
    }

    // Console logging with colors
    #logToConsole(level, message) {
        const timestamp = this.#getTimestamp();
        const color = this.#colors[level] || this.#colors.reset;
        const formattedMessage = `${timestamp} ${color}[${level.toUpperCase()}]${this.#colors.reset}: ${message}`;

        console.log(formattedMessage);
    }

    // File logging for errors
    async #logToFile(level, message) {
        if (level !== "error") return;

        try {
            const timestamp = this.#getTimestamp();
            const logEntry = `${timestamp} [${level.toUpperCase()}]: ${message}\n`;

            // Ensure directory exists
            const logDir = path.dirname("public/application.log");
            await fs.mkdir(logDir, { recursive: true });

            // Append to file
            await fs.appendFile("public/application.log", logEntry);
        } catch (error) {
            console.error("Failed to write to log file:", error.message);
        }
    }

    // Database initialization
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

        this.#isInitializing = true;
        this.#initPromise = this.#performDatabaseInit(mongoUri);

        try {
            await this.#initPromise;
        } catch (error) {
            this.#initPromise = null;
        }
    }

    async #performDatabaseInit(mongoUri) {
        try {
            if (this.#mongoConnection && this.#mongoConnection.readyState === 1) {
                return;
            }

            // Connect to MongoDB
            this.#mongoConnection = mongoose.createConnection(mongoUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                connectTimeoutMS: 10000,
                serverSelectionTimeoutMS: 5000
            });

            await this.#mongoConnection.asPromise();

            // Create log schema and model
            const logSchema = new mongoose.Schema({
                timestamp: { type: Date, default: Date.now },
                level: { type: String, enum: ["info", "warn", "error", "debug"], required: true },
                message: { type: String, required: true },
                requestId: { type: String, default: "NO-REQ" },
                userId: String,
                ip: String,
                userAgent: String,
                method: String,
                url: String,
                service: { type: String, default: this.#serviceName },
                meta: mongoose.Schema.Types.Mixed
            });

            this.#logModel = this.#mongoConnection.model(`${this.#serviceName}_logs`, logSchema);
            this.#isInitialized = true;

            console.log(`Logger initialized for service: ${this.#serviceName} with MongoDB`);
        } catch (error) {
            console.warn(`Database logging unavailable: ${error.message}`);
        } finally {
            this.#isInitializing = false;
        }
    }

    // Database logging
    async #logToDatabase(level, message, meta = {}) {
        if (!this.#isInitialized || !this.#logModel) {
            return;
        }

        try {
            const context = this.#getContext();

            const logEntry = {
                timestamp: new Date(),
                level,
                message,
                requestId: context.requestId || "NO-REQ",
                userId: context.userId || null,
                ip: context.ip || null,
                userAgent: context.userAgent || null,
                method: context.method || null,
                url: context.url || null,
                service: context.service || this.#serviceName,
                meta: Object.keys(meta).length > 0 ? meta : undefined
            };

            // Save to database (non-blocking)
            this.#logModel.create(logEntry).catch(err => {
                console.error(`Failed to save log to database: ${err.message}`);
            });
        } catch (error) {
            console.error(`Database logging error: ${error.message}`);
        }
    }

    // Get request context
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

    // Core logging method
    #log(level, message, meta = {}) {
        // Log to console (always)
        this.#logToConsole(level, message);

        // Log to file (errors only)
        this.#logToFile(level, message);

        // Log to database (if available)
        this.#logToDatabase(level, message, meta);
    }

    // Public methods
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

// Global singleton registry
if (!global.__customLoggerInstances) {
    global.__customLoggerInstances = new Map();
}

function getLoggerInstance(serviceName = "Logs") {
    if (!global.__customLoggerInstances.has(serviceName)) {
        global.__customLoggerInstances.set(serviceName, new UniversalLogger(serviceName));
    }
    return global.__customLoggerInstances.get(serviceName);
}

function createLogger(serviceName = "Logs") {
    return getLoggerInstance(serviceName);
}

// Export
module.exports = {
    logger: getLoggerInstance("Logs"),
    createLogger
};
