var Sql = require("sqlate").Sql
var Sqlite3 = require("sqlite3")
var SqliteHeaven = require("../mapbox")

var db = new Sqlite3.Database(":memory:")
db.serialize()

function execute(sql) {
	if (!(sql instanceof Sql)) throw new TypeError("Not Sql: " + sql)

	return new Promise((resolve, reject) => (
		db.all(String(sql), sql.parameters, (err, res) => (
			err ? reject(err) : resolve(res)
		))
	))
}

describe("MapboxSqliteHeaven", function() {
	require("./_heaven_test")(SqliteHeaven, db, execute)
})
