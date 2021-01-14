"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EExperienceLevelOptions = exports.EJobTypeFilterOptions = exports.ETimeFilterOptions = exports.ERelevanceFilterOptions = void 0;
var ERelevanceFilterOptions;
(function (ERelevanceFilterOptions) {
    ERelevanceFilterOptions["RELEVANT"] = "R";
    ERelevanceFilterOptions["RECENT"] = "DD";
})(ERelevanceFilterOptions = exports.ERelevanceFilterOptions || (exports.ERelevanceFilterOptions = {}));
var ETimeFilterOptions;
(function (ETimeFilterOptions) {
    ETimeFilterOptions["ANY"] = "";
    ETimeFilterOptions["DAY"] = "1";
    ETimeFilterOptions["WEEK"] = "1,2";
    ETimeFilterOptions["MONTH"] = "1,2,3,4";
})(ETimeFilterOptions = exports.ETimeFilterOptions || (exports.ETimeFilterOptions = {}));
var EJobTypeFilterOptions;
(function (EJobTypeFilterOptions) {
    EJobTypeFilterOptions["FULL_TIME"] = "F";
    EJobTypeFilterOptions["PART_TIME"] = "P";
    EJobTypeFilterOptions["TEMPORARY"] = "T";
    EJobTypeFilterOptions["CONTRACT"] = "C";
    EJobTypeFilterOptions["INTERNSHIP"] = "I";
})(EJobTypeFilterOptions = exports.EJobTypeFilterOptions || (exports.EJobTypeFilterOptions = {}));
var EExperienceLevelOptions;
(function (EExperienceLevelOptions) {
    EExperienceLevelOptions["INTERNSHIP"] = "1";
    EExperienceLevelOptions["ENTRY_LEVEL"] = "2";
    EExperienceLevelOptions["ASSOCIATE"] = "3";
    EExperienceLevelOptions["MID_SENIOR"] = "4";
    EExperienceLevelOptions["DIRECTOR"] = "5";
})(EExperienceLevelOptions = exports.EExperienceLevelOptions || (exports.EExperienceLevelOptions = {}));
