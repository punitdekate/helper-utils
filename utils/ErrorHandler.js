const { Logger: logger } = require("./Logger");

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
