"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const debug_1 = __importDefault(require("debug"));
const namespace = "scraper";
const logger = {
    info: debug_1.default(`${namespace}:info`),
    error: debug_1.default(`${namespace}:error`),
    enable: () => {
        debug_1.default.enable(`${namespace}:*`);
    },
    disable: () => {
        debug_1.default.disable();
    },
    enableInfo: () => {
        debug_1.default.enable(`${namespace}:info`);
    },
    enableError: () => {
        debug_1.default.enable(`${namespace}:error`);
    },
};
exports.logger = logger;
logger.info.log = console.log.bind(console);
if (!process.env.DEBUG) {
    logger.enable();
}
