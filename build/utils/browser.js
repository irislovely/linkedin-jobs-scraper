"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRandomUserAgent = void 0;
const randomUserAgent = require("random-useragent");
const browsers = [
    "Chrome",
];
const folders = [
    "/Browsers - Linux",
    "/Browsers - Mac",
];
const getRandomUserAgent = () => {
    return randomUserAgent.getRandom((ua) => {
        return browsers.some(e => e === ua.browserName) && folders.some(e => e === ua.folder);
    });
};
exports.getRandomUserAgent = getRandomUserAgent;
