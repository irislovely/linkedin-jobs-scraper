"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectors = exports.urls = void 0;
const urls = {
    jobs: "https://www.linkedin.com/jobs",
    jobsSearch: "https://www.linkedin.com/jobs/search"
};
exports.urls = urls;
const selectors = {
    container: ".results__container.results__container--two-pane",
    links: ".jobs-search__results-list li a.result-card__full-card-link",
    applyLink: "a[data-is-offsite-apply=true]",
    dates: 'time',
    companies: ".result-card__subtitle.job-result-card__subtitle",
    places: ".job-result-card__location",
    description: ".description__text",
    seeMoreJobs: "button.infinite-scroller__show-more-button",
    jobCriteria: "li.job-criteria__item",
    companySeeJobs: "a.top-card-layout__cta.top-card-layout__cta--primary",
    inlineNotification: "span.inline-notification__text",
};
exports.selectors = selectors;
