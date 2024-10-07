var Sql = require("sqlate").Sql
var Sqlite = require("better-sqlite3")
var SqliteHeaven = require("../better")
var BETTER_SQLITE3_VERSION = require("better-sqlite3/package").version

var sqlite = /^6\./.test(BETTER_SQLITE3_VERSION)
	? new Sqlite(":memory:", {memory: true})
	: new Sqlite(":memory:")

var SQLITE_VERSION = sqlite.prepare("SELECT sqlite_version() AS v").get().v

function execute(sql) {
	if (!(sql instanceof Sql)) throw new TypeError("Not Sql: " + sql)

	// Better-Sqlite3 throws if you use `all` on a statement that doesn't return
	// anything.
	var statement = sqlite.prepare(String(sql))
	var params = sql.parameters
	return statement.reader ? statement.all(params) : statement.run(params)
}

describe("BetterSqliteHeaven", function() {
	require("./_heaven_test")(SqliteHeaven, sqlite, execute, SQLITE_VERSION)
})
