import TypedEmitter from "typed-emitter";
import { LaunchOptions } from "puppeteer";
import { IEventListeners } from "./events";
import { IQuery, IQueryOptions } from "./query";
declare const LinkedinScraper_base: new () => TypedEmitter<IEventListeners>;
/**
 * Main class
 * @extends EventEmitter
 * @param options {LaunchOptions} Puppeteer browser options, for more informations see https://pptr.dev/#?product=Puppeteer&version=v2.0.0&show=api-puppeteerlaunchoptions
 * @constructor
 */
declare class LinkedinScraper extends LinkedinScraper_base {
    private _browser;
    private _context;
    private _state;
    options: LaunchOptions;
    constructor(options: LaunchOptions);
    /**
     * Enable logger
     * @returns void
     * @static
     */
    static enableLogger: () => void;
    /**
     * Disable logger
     * @returns void
     * @static
     */
    static disableLogger: () => void;
    /**
     * Enable logger info namespace
     * @returns void
     * @static
     */
    static enableLoggerInfo: () => void;
    /**
     * Enable logger error namespace
     * @returns void
     * @static
     */
    static enableLoggerError: () => void;
    /**
     * Wait for job details to load
     * @param page {Page}
     * @param jobTitle {string}
     * @param jobCompany {string}
     * @param timeout {number}
     * @returns {Promise<{success: boolean, error?: string}>}
     * @static
     * @private
     */
    private static _loadJobDetails;
    /**
     * Try to load more jobs
     * @param page {Page}
     * @param jobLinksTot {number}
     * @param timeout {number}
     * @returns {Promise<{success: boolean, error?: string}>}
     * @private
     */
    private static _loadMoreJobs;
    /**
     * Initialize browser
     * @private
     */
    private _initialize;
    /**
     * Validate query
     * @param {IQuery} query
     * @returns {IQueryValidationError[]}
     * @private
     */
    private _validateQuery;
    /**
     * Build jobs search url
     * @param {string} query
     * @param {string} location
     * @param {IQueryOptions} options
     * @returns {string}
     * @private
     */
    private _buildSearchUrl;
    /**
     * Scrape linkedin jobs
     * @param {IQuery | IQuery[]} queries
     * @param {IQueryOptions} [options]
     * @return {Promise<void>}
     * @private
     */
    private _run;
    /**
     * Scrape linkedin jobs
     * @param {IQuery | IQuery[]} queries
     * @param {IQueryOptions} [options]
     * @return {Promise<void>}
     */
    run: (queries: IQuery | IQuery[], options?: IQueryOptions | undefined) => Promise<void>;
    /**
     * Close browser instance
     * @returns {Promise<void>}
     */
    close: () => Promise<void>;
}
export { LinkedinScraper };
