const mongoose = require("mongoose");
const MAX_RETRY = 3;

async function mongoConnect({ connectionString, retry = 0 }) {
    try {
        if (!connectionString) {
            throw new Error("Connection string is required");
        }
        const db = await mongoose.createConnection(connectionString, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        return db;
    } catch (error) {
        console.error(`Error in connectToDB : ${error.message}`);
        if (retry < MAX_RETRY) {
            mongoConnect({ connectionString, retry: ++retry });
        } else {
            throw error;
        }
    }
}

module.exports = { mongoConnect };
