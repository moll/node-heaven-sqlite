var Sql = require("sqlate").Sql
var Sqlite3 = require("sqlite3")
var SqliteHeaven = require("../mapbox")
var demand = require("must")
var sql = require("sqlate")

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

var TABLE_DDL = sql`
	CREATE TEMPORARY TABLE "models" (
		"id" INTEGER PRIMARY KEY NOT NULL,
		"name" TEXT DEFAULT '',
		"age" INTEGER DEFAULT 0,

		CONSTRAINT models_max_age CHECK (age < 100)
	)
`

describe("MapboxSqliteHeaven", function() {
	require("./_heaven_test")(SqliteHeaven, db, execute)

	describe(".prototype.update", function() {
		beforeEach(execute.bind(null, TABLE_DDL))

		it("must return nothing given empty attributes", async function() {
			await execute(sql`INSERT INTO models VALUES (42, 'Mike', 13)`)

			var heaven = new SqliteHeaven(Object, db, "models")
			demand(await heaven.update({id: 42}, {})).be.undefined()

			demand(await execute(sql`SELECT * FROM models`)).eql([
				{id: 42, name: "Mike", age: 13}
			])
		})

		it("must return nothing given attributes", async function() {
			await execute(sql`INSERT INTO models VALUES (42, 'Mike', 13)`)

			var heaven = new SqliteHeaven(Object, db, "models")
			demand(await heaven.update({id: 42}, {name: "Raul"})).be.undefined()

			demand(await execute(sql`SELECT * FROM models`)).eql([
				{id: 42, name: "Raul", age: 13}
			])
		})
	})
})
