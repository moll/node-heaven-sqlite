var Sql = require("sqlate").Sql
var Sqlite3 = require("sqlite3")
var SqliteHeaven = require("../mapbox")
var SQLITE_VERSION = Sqlite3.VERSION

var sqlite = new Sqlite3.Database(":memory:")
sqlite.serialize()

function execute(sql) {
	if (!(sql instanceof Sql)) throw new TypeError("Not Sql: " + sql)

	return new Promise((resolve, reject) => (
		sqlite.all(String(sql), sql.parameters, (err, res) => (
			err ? reject(err) : resolve(res)
		))
	))
}

describe("MapboxSqliteHeaven", function() {
	require("./_heaven_test")(SqliteHeaven, sqlite, execute, SQLITE_VERSION)
})
