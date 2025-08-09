const mongoose = require("mongoose");
const { Logger: logger } = require("./Logger");
const MAX_RETRY = 3;

async function mongoConnect({ connectionString, retry = 0 }) {
    try {
        logger.info(`Connecting with database ${connectionString} on retry ${retry}`);
        if (!connectionString) {
            throw new Error("Connection string is required");
        }
        const userDB = await mongoose.createConnection(connectionString, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        return userDB;
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
