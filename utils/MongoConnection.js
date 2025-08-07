const mongoose = require("mongoose");
const { Logger: logger } = require("./Logger");
const MAX_RETRY = 3;

async function mongoConnect({ connectionString, retry = 0 }) {
    try {
        logger.info(`Connecting with database ${connectionString} on retry ${retry}`);
        mongoose
            .connect(connectionString, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            })
            .then(() => logger.info("Connected database successfully."));
    } catch (error) {
        logger.error(`Error in connectToDB : ${error.message}`);
        if (retry < MAX_RETRY) {
            mongoConnect({ connectionString, retry: ++retry });
        } else {
            throw error;
        }
    }
}

module.exports = { mongoConnect };
