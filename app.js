"use strict";
const dotenv = require("dotenv");
dotenv.config();
const responses = require("./utils/Responses.js");
const logger = require("./utils/Logger.js");
const sendEmail = require("./utils/SendEmail.js");
const responseHandler = require("./utils/ResponseHandler.js");
const errorHandler = require("./utils/ErrorHandler.js");
const requestContext = require("./utils/requestContext.js");
const mongoConnect = require("./utils/MongoConnection.js");

module.exports = {
    ...responses,
    ...logger,
    ...sendEmail,
    ...responseHandler,
    ...errorHandler,
    ...requestContext,
    ...mongoConnect
};
