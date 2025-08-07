"use strict";
const { AsyncLocalStorage } = require("async_hooks");

const asyncLocalStorage = new AsyncLocalStorage();

const requestContext = {
    run: (context, callback) => {
        asyncLocalStorage.run(context, callback);
    },
    get: () => {
        return asyncLocalStorage.getStore() || {};
    }
};

module.exports = { requestContext };
