var _ = require("./")

// SQLite v3.32 (2020-05-22) bumped the default SQLITE_MAX_VARIABLE_NUMBER
// count to 32766: https://www.sqlite.org/limits.html
//
// There doesn't seem to be a PRAGMA to query the max variable count
// unfortunately: https://www.sqlite.org/pragma.html
//
// There is a C-level function named `sqlite3_limit` to query or change the
// limit. However, AFAICT, you can only use it to lower the limit.
exports.has32kVars = function(ver) { return _.isVersionGt(ver, "3.32") }

// RETURNING arrived to SQLite v3.35.0 (2021-03-12).
exports.hasReturning = function(ver) { return _.isVersionGt(ver, "3.35") }

exports.getMaxVariableNumber = function(ver) {
	return exports.has32kVars(ver) ? 32766 : 999
}
