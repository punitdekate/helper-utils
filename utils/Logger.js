// logger.js
const winston = require("winston");
const mongoose = require("mongoose");
const requestContext = require("./RequestContext.js");
const { mongoConnect } = require("./MongoConnection.js");
const { DB_URL } = require("../constants.js");

class Logger {
    #logDatabase;
    #logSchema;
    #logModel;
    #customFormat;
    #logger;
    #logTableName;

    constructor(logDatabase, logTableName = "Logs") {
        this.#logDatabase = logDatabase;
        this.#logTableName = logTableName;

        // Schema
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

        // Model
        this.#logModel = this.#logDatabase.model(this.#logTableName, this.#logSchema);

        // Format
        this.#customFormat = winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`);

        // Init winston
        this.#initLogger();
    }

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

    #log(message, level = "info") {
        const ctx = requestContext.get() || {};
        const prefixedMessage = `[${ctx.requestId || "NO-ID"}] ${message}`;
        this.#logger.log({ level, message: prefixedMessage });

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

// ---- Singleton Export ----
let loggerInstancePromise = null;

async function getLogger(tableName = "Logs") {
    if (!loggerInstancePromise) {
        loggerInstancePromise = (async () => {
            const logDb = await mongoConnect({ connectionString: DB_URL, retry: 0 });
            return new Logger(logDb, tableName);
        })();
    }
    return loggerInstancePromise;
}

module.exports = { getLogger };
