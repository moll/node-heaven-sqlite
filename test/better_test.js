var Sql = require("sqlate").Sql
var Sqlite3 = require("better-sqlite3")
var SqliteHeaven = require("../better")
var db = new Sqlite3(":memory:", {memory: true})
var sql = require("sqlate")

function execute(sql) {
	if (!(sql instanceof Sql)) throw new TypeError("Not Sql: " + sql)

	// Better-Sqlite3 throws if you use `all` on a statement that doesn't return
	// anything.
	var statement = db.prepare(String(sql))
	var params = sql.parameters
	return statement.reader ? statement.all(params) : statement.run(params)
}

var TABLE_DDL = sql`
	CREATE TEMPORARY TABLE "models" (
		"id" INTEGER PRIMARY KEY NOT NULL,
		"name" TEXT DEFAULT '',
		"age" INTEGER DEFAULT 0,

		CONSTRAINT models_max_age CHECK (age < 100)
	)
`

describe("BetterSqliteHeaven", function() {
	require("./_heaven_test")(SqliteHeaven, db, execute)

	describe(".prototype.update", function() {
		beforeEach(execute.bind(null, TABLE_DDL))

		it("must return changes given empty attributes", function() {
			execute(sql`INSERT INTO models VALUES (42, 'Mike', 13)`)

			var heaven = new SqliteHeaven(Object, db, "models")
			heaven.update({id: 42}, {}).must.eql({changes: 0})

			execute(sql`SELECT * FROM models`).must.eql([
				{id: 42, name: "Mike", age: 13}
			])
		})

		it("must return changes given attributes", async function() {
			await execute(sql`INSERT INTO models VALUES (42, 'Mike', 13)`)

			var heaven = new SqliteHeaven(Object, db, "models")
			heaven.update({id: 42}, {name: "Raul"}).must.eql({
				changes: 1,
				lastInsertRowid: 42
			})

			execute(sql`SELECT * FROM models`).must.eql([
				{id: 42, name: "Raul", age: 13}
			])
		})
	})
})
