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
      details: this.details,
    };
  }
}

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
      details: this.details,
    };
  }
}

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
      details: this.details,
    };
  }
}

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
      details: this.details,
    };
  }
}

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
      details: this.details,
    };
  }
}

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
      details: this.details,
    };
  }
}

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
      details: this.details,
    };
  }
}

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
      details,
    };
  }
}

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
      ...this.options,
    });
  }
}

class FailureResponse {
  constructor(res, error, statusCode = 500) {
    this.res = res;
    this.error = error;
    this.statusCode = statusCode;
  }

  send() {
    const { message = "Internal Server Error", statusCode = 500 } = error;

    if (this.statusCode === 401) {
      return res
        .status(statusCode)
        .json(new Unauthorized(message).getMessage());
    }

    if (statusCode === 403) {
      return res.status(statusCode).json(new Forbidden(message).getMessage());
    }

    if (statusCode === 404) {
      return res
        .status(statusCode)
        .json(new ResourceNotFound(message).getMessage());
    }

    if (statusCode === 500) {
      return res
        .status(statusCode)
        .json(new InternalServerError(message).getMessage());
    }

    return res.status(statusCode).json({
      status: false,
      message: typeof message == String ? message : JSON.stringify(message),
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
