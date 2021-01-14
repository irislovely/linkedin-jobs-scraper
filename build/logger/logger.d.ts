import debug from "debug";
declare const logger: {
    info: debug.Debugger;
    error: debug.Debugger;
    enable: () => void;
    disable: () => void;
    enableInfo: () => void;
    enableError: () => void;
};
export { logger };
