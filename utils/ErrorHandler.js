"use strict";
const { logger } = require("./Logger");
const { failureResponse } = require("./ResponseHandler");

/**
 * errorHandler - Middleware for handling errors in Express.js applications.
 * @param {Object} err - The error object containing details about the error.
 * @param {Object} req - The request object from the Express.js framework.
 * @param {Object} res - The response object from the Express.js framework.
 * @param {Function} next - The next middleware function in the Express.js stack.
 * @description This middleware function logs the error details to a file and sends an appropriate error response back to the client.
 * It checks if the error has a code property to determine the type of error and responds accordingly.
 */
const errorHandler = (err, req, res, next) => {
    // Log detailed error to the file
    logger.error(`Time: ${new Date().toISOString()}\nRequest URL: ${req.url}\nRequest Body: ${JSON.stringify(req.body)}\nError Stack: ${err.stack || err}`);

    if (err) {
        if (err?.code) {
            return failureResponse(res, {
                message: err.message || "Internal Server Error",
                statusCode: 400
            });
        } else {
            return failureResponse(res, err);
        }
    } else {
        next();
    }
};

module.exports = { errorHandler };
