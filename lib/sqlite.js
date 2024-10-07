var _ = require("./")

// RETURNING arrived to SQLite v3.35.0 (2021-03-12).
exports.hasReturning = function(ver) { return _.isVersionGt(ver, "3.35") }

// TODO: Perhaps PRAGMA compile_options fits the bill.
// https://www.sqlite.org/pragma.html#pragma_compile_options
exports.getMaxVariableNumber = function(ver) {
	return has32kVars(ver) ? 32766 : 999
}

// SQLite v3.32 (2020-05-22) bumped the default SQLITE_MAX_VARIABLE_NUMBER
// count to 32766: https://www.sqlite.org/limits.html
//
// There doesn't seem to be a PRAGMA to query the runtime max variable count
// unfortunately: https://www.sqlite.org/pragma.html. There is compile_options.
//
// There is a C-level function named `sqlite3_limit` to query or change the
// limit. However, AFAICT, you can only use it to lower the limit.
function has32kVars(ver) { return _.isVersionGt(ver, "3.32") }
