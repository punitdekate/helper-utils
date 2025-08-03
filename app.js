const responses = require("./utils/Responses.js");

module.exports = {
  SuccessResponse: responses.SuccessResponse,
  FailureResponse: responses.FailureResponse,
  BadRequest: responses.BadRequest,
  Unauthorized: responses.Unauthorized,
  Forbidden: responses.Forbidden,
  ResourceNotFound: responses.ResourceNotFound,
  InternalServerError: responses.InternalServerError,
};
