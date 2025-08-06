"use strict";
const { Unauthorized, Forbidden, ResourceNotFound, InternalServerError } = require("./Responses.js");

/**
 * successResponse - Sends a successful response back to the client.
 * @param {Object} res - The response object from the Express.js framework.
 * @param {Object} data - The data to be sent in the response.
 * @param {number} [statusCode=200] - The HTTP status code for the response.
 * @param {Object} [options={}] - Additional options for the response, such as pagination details.
 * @param {number} [options.page] - The current page number (for pagination).
 * @param {number} [options.limit] - The number of items per page (for pagination).
 * @param {number} [options.totalCount] - The total number of items available (for pagination).
 * @description This function is used to send a successful response back to the client, optionally with pagination details.
 */
function successResponse(res, data, statusCode = 200, options = {}) {
    const { page, limit, totalCount } = options;
    let response = {
        data: data
    };
    if (page && limit) {
        response = {
            data: data,
            page: parseInt(page),
            limit: parseInt(limit),
            totalCount: totalCount || data.length
        };
    }

    return res.status(statusCode).json(response);
}

/**
 * failureResponse - Sends an error response back to the client.
 * @param {Object} res - The response object from the Express.js framework.
 * @param {Object} error - The error object containing details about the failure.
 * @param {string} [error.message="Internal Server Error"] - The error message to be sent in the response.
 * @param {number} [error.statusCode=500] - The HTTP status code for the response.
 * @description This function is used to send an error response back to the client, with appropriate status codes and messages.
 */
function failureResponse(res, error) {
    const { message = "Internal Server Error", statusCode = 500 } = error;

    if (statusCode === 401) {
        return res.status(statusCode).json(new Unauthorized(message).getMessage());
    }

    if (statusCode === 403) {
        return res.status(statusCode).json(new Forbidden(message).getMessage());
    }

    if (statusCode === 404) {
        return res.status(statusCode).json(new ResourceNotFound(message).getMessage());
    }

    if (statusCode === 500) {
        return res.status(statusCode).json(new InternalServerError(message).getMessage());
    }

    return res.status(statusCode).json({
        status: false,
        message: typeof message == String ? message : JSON.stringify(message)
    });
}

module.exports = {
    successResponse,
    failureResponse
};
