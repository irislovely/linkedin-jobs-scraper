"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkedinScraper = void 0;
const events_1 = require("events");
const puppeteer_extra_1 = __importDefault(require("puppeteer-extra"));
const events_2 = require("./events");
const states_1 = require("./states");
const defaults_1 = require("./defaults");
const logger_1 = require("../logger/logger");
const utils_1 = require("../utils/utils");
const url_1 = require("../utils/url");
const constants_1 = require("./constants");
const browser_1 = require("../utils/browser");
puppeteer_extra_1.default.use(require("puppeteer-extra-plugin-stealth")());
/**
 * Main class
 * @extends EventEmitter
 * @param options {LaunchOptions} Puppeteer browser options, for more informations see https://pptr.dev/#?product=Puppeteer&version=v2.0.0&show=api-puppeteerlaunchoptions
 * @constructor
 */
class LinkedinScraper extends events_1.EventEmitter {
    constructor(options) {
        super();
        this._browser = undefined;
        this._context = undefined;
        this._state = states_1.states.notInitialized;
        /**
         * Build jobs search url
         * @param {string} query
         * @param {string} location
         * @param {IQueryOptions} options
         * @returns {string}
         * @private
         */
        this._buildSearchUrl = (query, location, options) => {
            const url = new URL(constants_1.urls.jobsSearch);
            if (query && query.length) {
                url.searchParams.append("keywords", query);
            }
            if (location && location.length) {
                url.searchParams.append("location", location);
            }
            if (options && options.filters) {
                if (options.filters.companyJobsUrl) {
                    const queryParams = url_1.getQueryParams(options.filters.companyJobsUrl);
                    url.searchParams.append("f_C", queryParams["f_C"]);
                }
                if (options.filters.relevance) {
                    url.searchParams.append("sortBy", options.filters.relevance);
                }
                if (options.filters.time && options.filters.time.length) {
                    url.searchParams.append("f_TP", options.filters.time);
                }
                if (options.filters.type) {
                    url.searchParams.append("f_JT", options.filters.type);
                }
                if (options.filters.experience) {
                    url.searchParams.append("f_E", options.filters.experience);
                }
            }
            url.searchParams.append("redirect", "false");
            url.searchParams.append("position", "1");
            url.searchParams.append("pageNum", "0");
            return url.href;
        };
        /**
         * Scrape linkedin jobs
         * @param {IQuery | IQuery[]} queries
         * @param {IQueryOptions} [options]
         * @return {Promise<void>}
         * @private
         */
        this._run = (queries, options) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            let tag;
            if (!Array.isArray(queries)) {
                queries = [queries];
            }
            // Validation
            for (const query of queries) {
                const errors = this._validateQuery(query);
                if (errors.length) {
                    logger_1.logger.error(errors);
                    process.exit(1);
                }
            }
            // Initialize browser
            if (!this._browser) {
                yield this._initialize();
            }
            // Queries loop
            for (const query of queries) {
                // Merge options
                query.options = Object.assign(Object.assign(Object.assign({}, defaults_1.queryOptionsDefault), options), query.options);
                // Locations loop
                for (const location of query.options.locations) {
                    let jobsProcessed = 0;
                    tag = `[${query.query}][${location}]`;
                    logger_1.logger.info(tag, `Starting new query:`, `query="${query.query}"`, `location="${location}"`);
                    // Open new page in incognito context
                    const page = yield this._context.newPage();
                    // Set a random user agent
                    yield page.setUserAgent(browser_1.getRandomUserAgent());
                    // Enable optimization if required
                    if (query.options.optimize) {
                        yield page.setRequestInterception(true);
                        const resourcesToBlock = [
                            "image",
                            "stylesheet",
                            "media",
                            "font",
                            "texttrack",
                            "object",
                            "beacon",
                            "csp_report",
                            "imageset",
                        ];
                        page.on("request", request => {
                            if (resourcesToBlock.some(r => request.resourceType() === r)
                                || request.url().includes(".jpg")
                                || request.url().includes(".jpeg")
                                || request.url().includes(".png")
                                || request.url().includes(".gif")
                                || request.url().includes(".css")) {
                                request.abort();
                            }
                            else {
                                request.continue();
                            }
                        });
                    }
                    else {
                        yield page.setRequestInterception(false);
                    }
                    // Build search url
                    const searchUrl = this._buildSearchUrl(query.query || "", location, query.options);
                    yield page.goto(searchUrl, {
                        waitUntil: 'networkidle0',
                    });
                    // Scroll down page to the bottom
                    yield page.evaluate(_ => {
                        window.scrollTo(0, document.body.scrollHeight);
                    });
                    // Wait for lazy loading jobs
                    try {
                        yield page.waitForSelector(constants_1.selectors.container, { timeout: 5000 });
                    }
                    catch (err) {
                        logger_1.logger.info(tag, `No jobs found, skip`);
                        continue;
                    }
                    let jobIndex = 0;
                    // Pagination loop
                    while (jobIndex < query.options.limit) {
                        // Get number of all job links in the page
                        const jobLinksTot = yield page.evaluate((linksSelector) => document.querySelectorAll(linksSelector).length, constants_1.selectors.links);
                        if (jobLinksTot === 0) {
                            logger_1.logger.info(tag, `No jobs found, skip`);
                            break;
                        }
                        logger_1.logger.info(tag, "Jobs fetched: " + jobLinksTot);
                        // Jobs loop
                        for (jobIndex; jobIndex < jobLinksTot; ++jobIndex) {
                            tag = `[${query.query}][${location}][${jobIndex + 1}]`;
                            let jobId;
                            let jobLink;
                            let jobApplyLink;
                            let jobTitle;
                            let jobCompany;
                            let jobPlace;
                            let jobDescription;
                            let jobDescriptionHTML;
                            let jobDate;
                            let jobSenorityLevel;
                            let jobFunction;
                            let jobEmploymentType;
                            let jobIndustries;
                            let loadJobDetailsResponse;
                            try {
                                // Extract job main fields
                                [jobTitle, jobCompany, jobPlace, jobDate] = yield page.evaluate((linksSelector, companiesSelector, placesSelector, datesSelector, jobIndex) => {
                                    return [
                                        document.querySelectorAll(linksSelector)[jobIndex].innerText,
                                        document.querySelectorAll(companiesSelector)[jobIndex].innerText,
                                        document.querySelectorAll(placesSelector)[jobIndex].innerText,
                                        document.querySelectorAll(datesSelector)[jobIndex]
                                            .getAttribute('datetime')
                                    ];
                                }, constants_1.selectors.links, constants_1.selectors.companies, constants_1.selectors.places, constants_1.selectors.dates, jobIndex);
                                // Load job and extract description: skip in case of error
                                [[jobId, jobLink], loadJobDetailsResponse] = yield Promise.all([
                                    page.evaluate((linksSelector, jobIndex) => {
                                        const linkElem = document.querySelectorAll(linksSelector)[jobIndex];
                                        linkElem.click();
                                        return [
                                            linkElem.parentNode.getAttribute("data-id"),
                                            linkElem.getAttribute("href"),
                                        ];
                                    }, constants_1.selectors.links, jobIndex),
                                    LinkedinScraper._loadJobDetails(page, jobTitle, jobCompany),
                                ]);
                                // Check if job details loading has failed
                                if (!loadJobDetailsResponse.success) {
                                    const errorMessage = `${tag}\t${loadJobDetailsResponse.error}`;
                                    logger_1.logger.error(errorMessage);
                                    this.emit(events_2.events.scraper.error, errorMessage);
                                    continue;
                                }
                                // Use custom description function if available
                                if ((_a = query.options) === null || _a === void 0 ? void 0 : _a.descriptionFn) {
                                    [jobDescription, jobDescriptionHTML] = yield Promise.all([
                                        page.evaluate(`(${query.options.descriptionFn.toString()})();`),
                                        // page.evaluate((selector) => {
                                        //     return new XMLSerializer()
                                        //         .serializeToString((<HTMLElement>document.querySelector(selector)));
                                        page.evaluate((selector) => {
                                            return document.querySelector(selector).outerHTML;
                                        }, constants_1.selectors.description)
                                    ]);
                                }
                                else {
                                    [jobDescription, jobDescriptionHTML] = yield page.evaluate((selector) => {
                                        const el = document.querySelector(selector);
                                        // return [el.innerText, new XMLSerializer().serializeToString(el)];
                                        return [el.innerText, el.outerHTML];
                                    }, constants_1.selectors.description);
                                }
                                // Extract apply link
                                jobApplyLink = yield page.evaluate((selector) => {
                                    const applyBtn = document.querySelector(selector);
                                    return applyBtn ? applyBtn.getAttribute("href") : null;
                                }, constants_1.selectors.applyLink);
                                // Extract other job fields
                                [
                                    jobSenorityLevel,
                                    jobFunction,
                                    jobEmploymentType,
                                    jobIndustries,
                                ] = yield page.evaluate((jobCriteriaSelector) => {
                                    const items = document.querySelectorAll(jobCriteriaSelector);
                                    const criteria = [
                                        'Seniority level',
                                        'Job function',
                                        'Employment type',
                                        'Industries'
                                    ];
                                    const nodeList = criteria.map(criteria => {
                                        const el = Array.from(items)
                                            .find(li => li.querySelector('h3').innerText === criteria);
                                        return el ? el.querySelectorAll('span') : [];
                                    });
                                    return Array.from(nodeList)
                                        .map(spanList => Array.from(spanList)
                                        .map(e => e.innerText).join(', '));
                                }, constants_1.selectors.jobCriteria);
                            }
                            catch (err) {
                                const errorMessage = `${tag}\t${err.message}`;
                                this.emit(events_2.events.scraper.error, errorMessage);
                                continue;
                            }
                            // Emit data
                            this.emit(events_2.events.scraper.data, Object.assign(Object.assign({ query: query.query || "", location: location, link: jobLink }, jobApplyLink && { applyLink: jobApplyLink }), { title: jobTitle, company: jobCompany, place: jobPlace, description: jobDescription, descriptionHTML: jobDescriptionHTML, date: jobDate, senorityLevel: jobSenorityLevel, jobFunction: jobFunction, employmentType: jobEmploymentType, industries: jobIndustries }));
                            jobsProcessed++;
                            logger_1.logger.info(tag, `Processed`);
                            // Check if we reached the limit of jobs to process
                            if (jobIndex === query.options.limit - 1)
                                break;
                        }
                        // Check if we reached the limit of jobs to process
                        if (jobIndex === query.options.limit - 1)
                            break;
                        // Check if there are more jobs to load
                        logger_1.logger.info(tag, "Checking for new jobs to load...");
                        const loadMoreJobsResponse = yield LinkedinScraper._loadMoreJobs(page, jobLinksTot);
                        // Check if loading jobs has failed
                        if (!loadMoreJobsResponse.success) {
                            logger_1.logger.info(tag, "There are no more jobs available for the current query");
                            break;
                        }
                        yield utils_1.sleep(500);
                    }
                    // Close page
                    page && (yield page.close());
                }
            }
            // Emit end event
            this.emit(events_2.events.scraper.end);
        });
        /**
         * Scrape linkedin jobs
         * @param {IQuery | IQuery[]} queries
         * @param {IQueryOptions} [options]
         * @return {Promise<void>}
         */
        this.run = (queries, options) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (this._state === states_1.states.notInitialized) {
                    yield this._initialize();
                }
                else if (this._state === states_1.states.initializing) {
                    const timeout = 10000;
                    const waitTime = 10;
                    let elapsed = 0;
                    while (this._state !== states_1.states.initialized) {
                        yield utils_1.sleep(waitTime);
                        elapsed += waitTime;
                        if (elapsed >= timeout) {
                            throw new Error(`Initialize timeout exceeded: ${timeout}ms`);
                        }
                    }
                }
                yield this._run(queries, options);
            }
            catch (err) {
                logger_1.logger.error(err);
                this.emit(events_2.events.scraper.error, err);
            }
        });
        /**
         * Close browser instance
         * @returns {Promise<void>}
         */
        this.close = () => __awaiter(this, void 0, void 0, function* () {
            try {
                if (this._browser) {
                    this._browser.removeAllListeners() && (yield this._browser.close());
                }
            }
            finally {
                this._browser = undefined;
                this._state = states_1.states.notInitialized;
            }
        });
        this.options = options;
    }
    /**
     * Initialize browser
     * @private
     */
    _initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            this._state = states_1.states.initializing;
            this._browser && this._browser.removeAllListeners();
            this._browser = yield puppeteer_extra_1.default.launch(Object.assign(Object.assign({}, defaults_1.browserDefaults), this.options));
            this._context = yield this._browser.createIncognitoBrowserContext();
            this._browser.on(events_2.events.puppeteer.browser.disconnected, () => {
                this.emit(events_2.events.puppeteer.browser.disconnected);
            });
            this._browser.on(events_2.events.puppeteer.browser.targetcreated, () => {
                this.emit(events_2.events.puppeteer.browser.targetcreated);
            });
            this._browser.on(events_2.events.puppeteer.browser.targetchanged, () => {
                this.emit(events_2.events.puppeteer.browser.targetchanged);
            });
            this._browser.on(events_2.events.puppeteer.browser.targetdestroyed, () => {
                this.emit(events_2.events.puppeteer.browser.targetdestroyed);
            });
            this._state = states_1.states.initialized;
        });
    }
    /**
     * Validate query
     * @param {IQuery} query
     * @returns {IQueryValidationError[]}
     * @private
     */
    _validateQuery(query) {
        const errors = [];
        if (query.query && typeof (query.query) !== "string") {
            errors.push({
                param: "query",
                reason: `Must be a string`
            });
        }
        if (query.options) {
            const { locations, filters, descriptionFn, limit, } = query.options;
            if (locations && (!Array.isArray(locations) || !locations.every(e => typeof (e) === "string"))) {
                errors.push({
                    param: "options.locations",
                    reason: `Must be an array of strings`
                });
            }
            if (descriptionFn && typeof (descriptionFn) !== "function") {
                errors.push({
                    param: "options.descriptionFn",
                    reason: `Must be a function`
                });
            }
            if (query.options.hasOwnProperty("optimize") && typeof (query.options.optimize) !== "boolean") {
                errors.push({
                    param: "options.optimize",
                    reason: `Must be a boolean`
                });
            }
            if (limit && (!Number.isInteger(limit) || limit <= 0)) {
                errors.push({
                    param: "options.limit",
                    reason: `Must be a positive integer`
                });
            }
            if (filters) {
                if (filters.companyJobsUrl) {
                    if (typeof (filters.companyJobsUrl) !== "string") {
                        errors.push({
                            param: "options.filters.companyUrl",
                            reason: `Must be a string`
                        });
                    }
                    try {
                        const baseUrl = "https://www.linkedin.com/jobs/search/?";
                        new URL(filters.companyJobsUrl); // CHeck url validity
                        const queryParams = url_1.getQueryParams(filters.companyJobsUrl);
                        if (!filters.companyJobsUrl.toLowerCase().startsWith(baseUrl)
                            || !queryParams.hasOwnProperty("f_C") || !queryParams["f_C"]) {
                            errors.push({
                                param: "options.filters.companyJobsUrl",
                                reason: `Url is invalid. Please check the documentation on how find a company jobs link from LinkedIn`
                            });
                        }
                    }
                    catch (err) {
                        errors.push({
                            param: "options.filters.companyJobsUrl",
                            reason: `Must be a valid url`
                        });
                    }
                }
            }
        }
        return errors;
    }
}
exports.LinkedinScraper = LinkedinScraper;
/**
 * Enable logger
 * @returns void
 * @static
 */
LinkedinScraper.enableLogger = () => logger_1.logger.enable();
/**
 * Disable logger
 * @returns void
 * @static
 */
LinkedinScraper.disableLogger = () => logger_1.logger.disable();
/**
 * Enable logger info namespace
 * @returns void
 * @static
 */
LinkedinScraper.enableLoggerInfo = () => logger_1.logger.enableInfo();
/**
 * Enable logger error namespace
 * @returns void
 * @static
 */
LinkedinScraper.enableLoggerError = () => logger_1.logger.enableError();
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
LinkedinScraper._loadJobDetails = (page, jobTitle, jobCompany, timeout = 2000) => __awaiter(void 0, void 0, void 0, function* () {
    const waitTime = 10;
    let elapsed = 0;
    let loaded = false;
    while (!loaded) {
        loaded = yield page.evaluate((jobTitle, jobCompany) => {
            const jobHeaderRight = document.querySelector(".topcard__content-left");
            return jobHeaderRight &&
                jobHeaderRight.innerText.includes(jobTitle) &&
                jobHeaderRight.innerText.includes(jobCompany);
        }, jobTitle, jobCompany);
        if (loaded)
            return { success: true };
        yield utils_1.sleep(waitTime);
        elapsed += waitTime;
        if (elapsed >= timeout) {
            return {
                success: false,
                error: `Timeout on loading job: '${jobTitle}'`
            };
        }
    }
    return { success: true };
});
/**
 * Try to load more jobs
 * @param page {Page}
 * @param jobLinksTot {number}
 * @param timeout {number}
 * @returns {Promise<{success: boolean, error?: string}>}
 * @private
 */
LinkedinScraper._loadMoreJobs = (page, jobLinksTot, timeout = 2000) => __awaiter(void 0, void 0, void 0, function* () {
    const waitTime = 10;
    let elapsed = 0;
    let loaded = false;
    let clicked = false;
    yield page.evaluate(_ => {
        window.scrollTo(0, document.body.scrollHeight);
    });
    while (!loaded) {
        if (!clicked) {
            clicked = yield page.evaluate((selector) => {
                const button = document.querySelector(selector);
                if (button) {
                    button.click();
                    return true;
                }
                else {
                    return false;
                }
            }, constants_1.selectors.seeMoreJobs);
        }
        loaded = yield page.evaluate((selector, jobLinksTot) => {
            window.scrollTo(0, document.body.scrollHeight);
            return document.querySelectorAll(selector).length > jobLinksTot;
        }, constants_1.selectors.links, jobLinksTot);
        if (loaded)
            return { success: true };
        yield utils_1.sleep(waitTime);
        elapsed += waitTime;
        if (elapsed >= timeout) {
            return {
                success: false,
                error: `Timeout on loading more jobs`
            };
        }
    }
    return { success: true };
});
