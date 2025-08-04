import winston from "winston";

// Custom format for the logs
const customFormat = winston.format.printf(({ timestamp, level, message }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

// Create a logger with different transports for error and info
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(winston.format.timestamp(), customFormat),
  transports: [
    // Logs errors to a file
    new winston.transports.File({
      filename: "public/application.log",
      level: "error",
    }),
    // Logs info and above to the console
    new winston.transports.Console({
      level: "info",
      format: winston.format.combine(
        winston.format.colorize(), // Adds color to console logs
        winston.format.timestamp(),
        customFormat
      ),
    }),
  ],
});

module.exports = { logger };
