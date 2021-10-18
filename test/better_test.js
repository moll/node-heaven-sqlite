var Sql = require("sqlate").Sql
var Sqlite3 = require("better-sqlite3")
var SqliteHeaven = require("../better")
var db = new Sqlite3(":memory:", {memory: true})

function execute(sql) {
	if (!(sql instanceof Sql)) throw new TypeError("Not Sql: " + sql)

	// Better-Sqlite3 throws if you use `all` on a statement that doesn't return
	// anything.
	var statement = db.prepare(String(sql))
	var params = sql.parameters
	return statement.reader ? statement.all(params) : statement.run(params)
}

describe("BetterSqliteHeaven", function() {
	require("./_heaven_test")(SqliteHeaven, db, execute)
})
