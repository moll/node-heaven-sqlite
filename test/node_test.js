var _ = require("../lib")
var Sql = require("sqlate").Sql
var SqliteHeaven = require("../node")
var NODE_VERSION = process.version.replace(/^v/, "")

if (!_.isVersionGt(NODE_VERSION, "22.5")) xdescribe("NodeSqliteHeaven")
else describe("NodeSqliteHeaven", function() {
	var Sqlite = require("node:sqlite").DatabaseSync
	var sqlite = new Sqlite(":memory:")
	var SQLITE_VERSION = sqlite.prepare("SELECT sqlite_version() AS v").get().v

	function execute(sql) {
		if (!(sql instanceof Sql)) throw new TypeError("Not Sql: " + sql)

		var statement = sqlite.prepare(String(sql))
		return statement.all.apply(statement, sql.parameters)
	}

	require("./_heaven_test")(SqliteHeaven, sqlite, execute, SQLITE_VERSION)
})
