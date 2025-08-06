/**
 * BadRequest -   Represents a 400 Bad Request error.
 * @param {string} message - The error message.
 * @param {Object} [details={}] - Additional details about the error.
 * @description This class is used to handle cases where the server cannot process the request due to client error (e.g., malformed request syntax, invalid request message framing, or deceptive request routing).
 */
class BadRequest {
    constructor(message, details = {}) {
        this.message = message || "Bad Request";
        this.statusCode = 400;
    }
    getMessage() {
        return {
            error: "BadRequest",
            status: false,
            message: this.message,
            details: this.details
        };
    }
}

/**
 * Unauthorized - Represents a 401 Unauthorized error.
 * @param {string} message - The error message.
 * @param {Object} [details={}] - Additional details about the error.
 * @description This class is used to handle cases where authentication is required and has failed or has not yet been provided.
 */
class Unauthorized {
    constructor(message, details = {}) {
        this.message = message || "Unauthorized";
        this.statusCode = 401;
    }
    getMessage() {
        return {
            error: "Unauthorize",
            status: false,
            message: this.message,
            details: this.details
        };
    }
}

/**
 * Forbidden - Represents a 403 Forbidden error.
 * @param {string} message - The error message.
 * @param {Object} [details={}] - Additional details about the error.
 * @description This class is used to handle cases where the server understands the request but refuses to authorize it.
 */
class Forbidden {
    constructor(message, details = {}) {
        this.message = message || "Forbidden";
        this.statusCode = 403;
    }
    getMessage() {
        return {
            error: "Forbidden",
            status: false,
            message: this.message,
            details: this.details
        };
    }
}

/**
 * ResourceNotFound - Represents a 404 Not Found error.
 * @param {string} message - The error message.
 * @param {Object} [details={}] - Additional details about the error.
 * @description This class is used to handle cases where a requested resource could not be found.
 */
class ResourceNotFound {
    constructor(message, details = {}) {
        this.message = message || "Not Found";
        this.statusCode = 404;
    }
    getMessage() {
        return {
            error: "ResourceNotFound",
            status: false,
            message: this.message,
            details: this.details
        };
    }
}

/**
 * InternalServerError - Represents a 500 Internal Server Error.
 * @param {string} message - The error message.
 * @param {Object} [details={}] - Additional details about the error.
 * @description This class is used to handle internal server errors in the application.
 */
class InternalServerError {
    constructor(message, details = {}) {
        this.message = message || "Internal Server Error";
        this.statusCode = 500;
    }
    getMessage() {
        return {
            error: "InternalServerError",
            status: false,
            message: this.message,
            details: this.details
        };
    }
}

/**
 * Conflict - Represents a 409 Conflict error.
 * @param {string} message - The error message.
 * @param {Object} [details={}] - Additional details about the error.
 * @description This class is used to handle cases where a request could not be completed due to a conflict with the current state of the resource.
 */
class Conflict {
    constructor(message, details = {}) {
        this.message = message || "Conflict";
        this.statusCode = 409;
    }
    getMessage() {
        return {
            error: "Conflict",
            status: false,
            message: this.message,
            details: this.details
        };
    }
}

/**
 * UnprocessableEntity - Represents a 422 Unprocessable Entity error.
 * @param {string} message - The error message.
 * @param {Object} [details={}] - Additional details about the error.
 * @description This class is used to handle cases where the server understands the content type of the request entity, and the syntax of the request entity is correct, but it was unable to process the contained instructions.
 */
class UnprocessableEntity {
    constructor(message, details = {}) {
        this.message = message || "Unprocessable Entity";
        this.statusCode = 422;
    }
    getMessage() {
        return {
            error: "UnprocessableEntity",
            status: false,
            message: this.message,
            details: this.details
        };
    }
}

/**
 * CustomMongooseError - Custom error class for handling Mongoose-related errors.
 * @param {string} message - The error message.
 * @param {number} [statusCode=500] - The HTTP status code for the error.
 * @param {string} name - The name of the error.
 * @param {Object} [details={}] - Additional details about the error.
 * description This class extends the built-in Error class to provide a structured error response for Mongoose operations.
 * @extends Error
 */
class CustomMongooseError extends Error {
    constructor(message, statusCode = 500, name, details = {}) {
        super(message);
        this.statusCode = statusCode;
        this.name = name;
    }

    getMessage() {
        return {
            status: false,
            message: this.message,
            details
        };
    }
}

/**
 * SuccessResponse - Represents a successful response.
 * @param {Object} res - The response object from the Express.js framework.
 * @param {Object} data - The data to be sent in the response.
 * @param {number} [statusCode=200] - The HTTP status code for the response.
 * @param {Object} [options={}] - Additional options for the response.
 * @description This class is used to send a successful response back to the client.
 * @example
 * const response = new SuccessResponse(res, { message: "Success" });
 * response.send();
 */
class SuccessResponse {
    constructor(res, data, statusCode = 200, options = {}) {
        this.res = res;
        this.data = data;
        this.statusCode = statusCode;
        this.options = options;
    }

    send() {
        this.res.status(this.statusCode).json({
            status: true,
            data: this.data,
            ...this.options
        });
    }
}

/**
 * FailureResponse - Represents a failed response.
 * @param {Object} res - The response object from the Express.js framework.
 * @param {Error} error - The error object containing details about the failure.
 * @param {number} [statusCode=500] - The HTTP status code for the response.
 * @description This class is used to send an error response back to the client.
 * @example
 * const response = new FailureResponse(res, new Error("Something went wrong"), 500);
 * response.send();
 */
class FailureResponse {
    constructor(res, error, statusCode = 500) {
        this.res = res;
        this.error = error;
        this.statusCode = statusCode;
    }

    send() {
        const { message = "Internal Server Error", statusCode = 500 } = error;

        if (this.statusCode === 401) {
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
}

module.exports = {
    BadRequest,
    Unauthorized,
    Forbidden,
    ResourceNotFound,
    InternalServerError,
    Conflict,
    UnprocessableEntity,
    SuccessResponse,
    FailureResponse
};
