var O = require("oolong")
var Sqlite3 = require("sqlite3")
var SqliteHeaven = require("..")
var sql = require("sqlate")

var db = new Sqlite3.Database(":memory:")
db.serialize()

function execute(sql) {
	return new Promise((resolve, reject) => (
		db.all(String(sql), sql.parameters, (err, res) => (
			err ? reject(err) : resolve(res)
		))
	))
}

var TABLE_DDL = `
	CREATE TEMPORARY TABLE "models" (
		"id" INTEGER PRIMARY KEY NOT NULL,
		"name" TEXT DEFAULT '',
		"age" INTEGER DEFAULT 0,

		CONSTRAINT models_max_age CHECK (age < 100)
	)
`

class HeavenOnTest extends SqliteHeaven {
	assign(model, attrs) { return model.set(attrs) }

	// As we've got attributes in a nested object, model identification that
	// bypasses Heaven.prototype.identify gets spotted.
	identify(model) {
		if (model instanceof this.model) return model.attributes[this.idAttribute]
		else return model[this.idAttribute]
	}
}

class Model {
	// Saving attributes to this.attributes catches double model initialization.
	constructor(attrs) { this.attributes = attrs }
	set(attrs) { O.assign(this.attributes, attrs); return this }
	toJSON() { return O.clone(this.attributes) }
}

describe("SqliteHeaven", function() {
	beforeEach(function*() { yield execute("BEGIN") })
	afterEach(function*() { yield execute("ROLLBACK") })

	var ROWS = [
		{id: 1, name: "Mike", age: 13},
		{id: 2, name: "John", age: 13},
		{id: 3, name: "Mike", age: 42}
	]

	describe(".prototype.with", function() {
		it("must set new idColumn", function() {
			create().with({idColumn: "age"}).idColumn.must.equal("age")
		})
	})

	describe(".prototype.search", function() {
		beforeEach(function() { return execute(TABLE_DDL) })
		beforeEach(insert.bind(null, "models", ROWS))

		it("must throw TypeError given undefined", function() {
			var err
			try { create().search(undefined) } catch (ex) { err = ex }
			err.must.be.an.error(TypeError, /bad query/i)
		})

		it("must throw TypeError given null", function() {
			var err
			try { create().search(null) } catch (ex) { err = ex }
			err.must.be.an.error(TypeError, /bad query/i)
		})

		it("must throw TypeError given an object", function() {
			var err
			try { create().search({}) } catch (ex) { err = ex }
			err.must.be.an.error(TypeError, /bad query/i)
		})

		describe("given a numeric id", function() {
			it("must resolve with an empty array if none returned", function*() {
				yield create().search(42).must.then.eql([])
			})

			it("must resolve with models queried by idColumn", function*() {
				yield create({idColumn: "age"}).search(13).must.then.eql([
					new Model({id: 1, name: "Mike", age: 13}),
					new Model({id: 2, name: "John", age: 13})
				])
			})
		})

		describe("given a string id", function() {
			it("must resolve with empty array if none returned", function*() {
				yield create({idColumn: "name"}).search("Rob").must.then.eql([])
			})

			it("must resolve with models queried by idColumn", function*() {
				yield create({idColumn: "name"}).search("Mike").must.then.eql([
					new Model({id: 1, name: "Mike", age: 13}),
					new Model({id: 3, name: "Mike", age: 42})
				])
			})

			it("must query given \"=\"", function*() {
				yield execute(sql`INSERT INTO models (name, age) VALUES ('=', 99)`)
				var model = yield create({idColumn: "name"}).search("=")
				model.must.eql([new Model({id: 4, name: "=", age: 99})])
			})
		})

		describe("given a model", function() {
			it("must resolve with an empty array if none returned", function*() {
				yield create().search(new Model({id: 4})).must.then.eql([])
			})

			it("must resolve with models queried by idColumn", function*() {
				var heaven = create({idAttribute: "age", idColumn: "age"})
				var model = new Model({age: 42})
				var models = yield heaven.search(model)
				models.must.eql([new Model({id: 3, name: "Mike", age: 42})])
				models[0].must.equal(model)
			})
		})

		describe("given Sql", function() {
			it("must resolve with models", function*() {
				var models = yield create().search(sql`
					SELECT * FROM models WHERE age < 15
				`)

				models.must.eql([
					new Model({id: 1, name: "Mike", age: 13}),
					new Model({id: 2, name: "John", age: 13})
				])
			})
		})

		describe("given an array", function() {
			it("must throw TypeError given undefined in array", function() {
				var err
				try { create().search([undefined]) } catch (ex) { err = ex }
				err.must.be.an.error(TypeError, /bad query/i)
			})

			it("must throw TypeError given null in array", function() {
				var err
				try { create().search([null]) } catch (ex) { err = ex }
				err.must.be.an.error(TypeError, /bad query/i)
			})

			it("must throw TypeError given an object in array", function() {
				var err
				try { create().search([{}]) } catch (ex) { err = ex }
				err.must.be.an.error(TypeError, /bad query/i)
			})

			it("must throw TypeError given numeric and string ids", function() {
				var err
				try { create().search([1, "John"]) } catch (ex) { err = ex }
				err.must.be.an.error(TypeError, /mixed/i)
			})

			it("must resolve with empty array given an empty array", function*() {
				yield create().search([]).must.then.eql([])
			})

			it("must resolve with empty array if no ids match", function*() {
				yield create().search([5, 6, 7]).must.then.eql([])
			})

			it("must resolve with models given numeric ids", function*() {
				yield execute(sql`INSERT INTO models (name, age) VALUES ('Rob', 55)`)

				yield create({idColumn: "age"}).search([42, 55]).must.then.eql([
					new Model({id: 3, name: "Mike", age: 42}),
					new Model({id: 4, name: "Rob", age: 55})
				])
			})

			it("must resolve with models given string ids", function*() {
				yield execute(sql`INSERT INTO models (name, age) VALUES ('Rob', 55)`)

				var heaven = create({idColumn: "name"})
				yield heaven.search(["John", "Rob"]).must.then.eql([
					new Model({id: 2, name: "John", age: 13}),
					new Model({id: 4, name: "Rob", age: 55})
				])
			})

			it("must resolve with models given models", function*() {
				var a = new Model({id: 1})
				var b = new Model({id: 3})

				var models = yield create().search([a, b])
				models.length.must.equal(2)
				models[0].must.equal(a)
				models[1].must.equal(b)

				a.must.eql(new Model({id: 1, name: "Mike", age: 13}))
				b.must.eql(new Model({id: 3, name: "Mike", age: 42}))
			})
		})
	})

	describe(".prototype.read", function() {
		beforeEach(function() { return execute(TABLE_DDL) })
		beforeEach(insert.bind(null, "models", ROWS))

		it("must throw TypeError given undefined", function() {
			var err
			try { create().read(undefined) } catch (ex) { err = ex }
			err.must.be.an.error(TypeError, /bad query/i)
		})

		it("must throw TypeError given null", function() {
			var err
			try { create().read(null) } catch (ex) { err = ex }
			err.must.be.an.error(TypeError, /bad query/i)
		})

		it("must throw TypeError given an object", function() {
			var err
			try { create().read({}) } catch (ex) { err = ex }
			err.must.be.an.error(TypeError, /bad query/i)
		})

		it("must throw TypeError given an array", function() {
			var err
			try { create().read([]) } catch (ex) { err = ex }
			err.must.be.an.error(TypeError, /bad query/i)
		})

		describe("given a numeric id", function() {
			it("must resolve with null if none returned", function*() {
				yield create().read(42).must.then.be.null()
			})

			it("must resolve with model queried by idColumn", function*() {
				var model = yield create({idColumn: "age"}).read(13)
				model.must.eql(new Model({id: 1, name: "Mike", age: 13}))
			})
		})

		describe("given a string id", function() {
			it("must resolve with null if none returned", function*() {
				yield create({idColumn: "name"}).read("Rob").must.then.be.null()
			})

			it("must resolve with model queried by idColumn", function*() {
				var heaven = create({idColumn: "name"})
				var model = yield heaven.read("Mike")
				model.must.eql(new Model({id: 1, name: "Mike", age: 13}))
			})

			it("must query given \"=\"", function*() {
				yield execute(sql`INSERT INTO models (name, age) VALUES ('=', 99)`)
				var model = yield create({idColumn: "name"}).read("=")
				model.must.eql(new Model({id: 4, name: "=", age: 99}))
			})
		})

		describe("given a model", function() {
			it("must resolve with null if none returned", function*() {
				yield create().read(new Model({id: 4})).must.then.be.null()
			})

			it("must resolve with model queried by idColumn", function*() {
				var heaven = create().with({idAttribute: "age", idColumn: "age"})
				var model = new Model({age: 42})
				yield heaven.read(model).must.then.equal(model)
				model.must.eql(new Model({id: 3, name: "Mike", age: 42}))
			})
		})

		describe("given Sql", function() {
			it("must resolve with model", function*() {
				var model = yield create().read(sql`
					SELECT * FROM models WHERE age < 15
				`)

				model.must.eql(new Model({id: 1, name: "Mike", age: 13}))
			})
		})
	})

	describe(".prototype.create", function() {
		beforeEach(function*() { yield execute(TABLE_DDL) })

		it("must throw TypeError given undefined", function() {
			var err
			try { create().create(undefined) } catch (ex) { err = ex }
			err.must.be.an.error(TypeError, /bad attributes/i)
		})

		it("must throw TypeError given null", function() {
			var err
			try { create().create(null) } catch (ex) { err = ex }
			err.must.be.an.error(TypeError, /bad attributes/i)
		})

		// Ensures exceptions from the creation promise get propagated correctly.
		it("must throw error on constraint violation", function*() {
			var err
			try { yield create().create([{name: "Mike", age: 101}]) }
			catch (ex) { err = ex }
			err.must.be.an.error(/SQLITE_CONSTRAINT/)
			yield execute("SELECT * FROM models").must.then.eql([])
		})

		describe("given attributes", function() {
			it("must create model", function*() {
				var model = yield create().create({name: "John", age: 13})
				var rows = yield execute("SELECT * FROM models")
				rows.must.eql([{id: 1, name: "John", age: 13}])
				model.must.eql(new Model({id: 1, name: "John", age: 13}))
			})

			it("must create model given inherited attributes", function*() {
				var heaven = create()
				var model = yield heaven.create(Object.create({name: "John", age: 13}))

				var rows = yield execute("SELECT * FROM models")
				rows.must.eql([{id: 1, name: "John", age: 13}])
				model.must.eql(new Model({id: 1, name: "John", age: 13}))
			})

			it("must create model given empty attributes", function*() {
				var model = yield create().create({})
				var rows = yield execute("SELECT * FROM models")
				rows.must.eql([{id: 1, name: "", age: 0}])
				model.must.eql(new Model({id: 1, name: "", age: 0}))
			})
		})

		describe("given a model", function() {
			it("must create model", function*() {
				var model = yield create().create(new Model({name: "John", age: 13}))
				var rows = yield execute("SELECT * FROM models")
				rows.must.eql([{id: 1, name: "John", age: 13}])
				model.must.eql(new Model({id: 1, name: "John", age: 13}))
			})
		})

		describe("given an array", function() {
			it("must throw TypeError given undefined", function() {
				var err
				try { create().create([undefined]) } catch (ex) { err = ex }
				err.must.be.an.error(TypeError, /bad attributes/i)
			})

			it("must throw TypeError given undefined and object array", function() {
				var err
				try { create().create([undefined, {}]) } catch (ex) { err = ex }
				err.must.be.an.error(TypeError, /bad attributes/i)
			})

			it("must throw TypeError given null", function() {
				var err
				try { create().create([null]) } catch (ex) { err = ex }
				err.must.be.an.error(TypeError, /bad attributes/i)
			})

			it("must throw TypeError given null and object", function() {
				var err
				try { create().create([null, {}]) } catch (ex) { err = ex }
				err.must.be.an.error(TypeError, /bad attributes/i)
			})

			it("must not create models given an empty array", function*() {
				var models = yield create().create([])
				yield execute("SELECT * FROM models").must.then.eql([])
				models.must.eql([])
			})

			it("must create model given empty attributes", function*() {
				var heaven = create()
				var model = yield heaven.create([{}])

				var rows = yield execute("SELECT * FROM models")
				rows.must.eql([{id: 1, name: "", age: 0}])
				model.must.eql([new Model({id: 1, name: "", age: 0})])
			})

			it("must create model", function*() {
				var models = yield create().create([{name: "John", age: 13}])
				var rows = yield execute("SELECT * FROM models")
				rows.must.eql([{id: 1, name: "John", age: 13}])
				models.must.eql([new Model({id: 1, name: "John", age: 13})])
			})

			it("must create models", function*() {
				var models = yield create().create([
					{name: "John", age: 13},
					{name: "Mike", age: 42}
				])

				yield execute("SELECT * FROM models").must.then.eql([
					{id: 1, name: "John", age: 13},
					{id: 2, name: "Mike", age: 42}
				])

				models.must.eql([
					new Model({id: 1, name: "John", age: 13}),
					new Model({id: 2, name: "Mike", age: 42})
				])
			})

			it("must create models given empty attributes", function*() {
				var models = yield create().create([{name: "John"}, {}])

				yield execute("SELECT * FROM models").must.then.eql([
					{id: 1, name: "John", age: 0},
					{id: 2, name: "", age: 0}
				])

				models.must.eql([
					new Model({id: 1, name: "John", age: 0}),
					new Model({id: 2, name: "", age: 0})
				])
			})

			it("must return models in order", function*() {
				var models = yield create().create([
					{name: "Mike", age: 42},
					{name: "John", age: 13}
				])

				yield execute("SELECT * FROM models").must.then.eql([
					{id: 1, name: "Mike", age: 42},
					{id: 2, name: "John", age: 13}
				])

				models.must.eql([
					new Model({id: 1, name: "Mike", age: 42}),
					new Model({id: 2, name: "John", age: 13})
				])
			})
		})
	})

	describe(".prototype.update", function() {
		beforeEach(function*() { yield execute(TABLE_DDL) })
		beforeEach(insert.bind(null, "models", ROWS))

		it("must throw TypeError given undefined", function() {
			var err
			try { create().update(undefined, {name: "John"}) } catch (ex) { err = ex }
			err.must.be.an.error(TypeError, /bad query/i)
		})

		it("must throw TypeError given null", function() {
			var err
			try { create().update(null, {name: "John"}) } catch (ex) { err = ex }
			err.must.be.an.error(TypeError, /bad query/i)
		})

		it("must throw TypeError given an object", function() {
			var err
			try { create().update({}, {name: "John"}) } catch (ex) { err = ex }
			err.must.be.an.error(TypeError, /bad query/i)
		})

		it("must throw TypeError given an array", function() {
			var err
			try { create().update([], {name: "John"}) } catch (ex) { err = ex }
			err.must.be.an.error(TypeError, /bad query/i)
		})

		describe("given a numeric id and attributes", function() {
			it("must update models queried by idColumn", function*() {
				yield create({idColumn: "age"}).update(13, {name: "Raul"})

				yield execute("SELECT * FROM models").must.then.eql([
					{id: 1, name: "Raul", age: 13},
					{id: 2, name: "Raul", age: 13},
					{id: 3, name: "Mike", age: 42}
				])
			})

			it("must do nothing given empty attributes", function*() {
				yield create().update(1, {})
				yield execute("SELECT * FROM models").must.then.eql(ROWS)
			})
		})

		describe("given a string id and attributes", function() {
			it("must update models queried by idColumn", function*() {
				yield create({idColumn: "name"}).update("Mike", {name: "Raul"})

				yield execute("SELECT * FROM models").must.then.eql([
					{id: 1, name: "Raul", age: 13},
					{id: 2, name: "John", age: 13},
					{id: 3, name: "Raul", age: 42}
				])
			})

			it("must do nothing given empty attributes", function*() {
				yield create().update("Mike", {})
				yield execute("SELECT * FROM models").must.then.eql(ROWS)
			})
		})

		describe("given a model and attributes", function() {
			it("must update model queried by idColumn", function*() {
				var heaven = create({idAttribute: "age", idColumn: "age"})
				yield heaven.update(new Model({age: 13}), {name: "Raul"})

				yield execute("SELECT * FROM models").must.then.eql([
					{id: 1, name: "Raul", age: 13},
					{id: 2, name: "Raul", age: 13},
					{id: 3, name: "Mike", age: 42}
				])
			})

			it("must do nothing given empty attributes", function*() {
				yield create().update(new Model({id: 1}), {})
				yield execute("SELECT * FROM models").must.then.eql(ROWS)
			})
		})
	})

	describe(".prototype.delete", function() {
		beforeEach(function*() { yield execute(TABLE_DDL) })
		beforeEach(insert.bind(null, "models", ROWS))

		it("must throw TypeError given undefined", function() {
			var err
			try { create().delete(undefined) } catch (ex) { err = ex }
			err.must.be.an.error(TypeError, /bad query/i)
		})

		it("must throw TypeError given null", function() {
			var err
			try { create().delete(null) } catch (ex) { err = ex }
			err.must.be.an.error(TypeError, /bad query/i)
		})

		it("must throw TypeError given an object", function() {
			var err
			try { create().delete({}) } catch (ex) { err = ex }
			err.must.be.an.error(TypeError, /bad query/i)
		})

		it("must throw TypeError given an array", function() {
			var err
			try { create().delete([]) } catch (ex) { err = ex }
			err.must.be.an.error(TypeError, /bad query/i)
		})

		describe("given a numeric id and attributes", function() {
			it("must delete models queried by idColumn", function*() {
				yield create({idColumn: "age"}).delete(13)

				yield execute("SELECT * FROM models").must.then.eql([
					{id: 3, name: "Mike", age: 42}
				])
			})
		})

		describe("given a string id and attributes", function() {
			it("must delete models queried by idColumn", function*() {
				yield create({idColumn: "name"}).delete("Mike")

				yield execute("SELECT * FROM models").must.then.eql([
					{id: 2, name: "John", age: 13}
				])
			})
		})

		describe("given a model and attributes", function() {
			it("must delete model queried by idColumn", function*() {
				var heaven = create({idAttribute: "age", idColumn: "age"})
				yield heaven.delete(new Model({age: 13}))

				yield execute("SELECT * FROM models").must.then.eql([
					{id: 3, name: "Mike", age: 42}
				])
			})
		})
	})
})

function insert(table, rows) {
	return execute(sql`
		INSERT INTO ${sql.table(table)}
			${sql.tuple(O.keys(rows[0]).map(sql.column))}
		VALUES
			${sql.csv(rows.map(O.values).map(sql.tuple))}
	`)
}

function create(props) {
	var heaven = new HeavenOnTest(Model, db, "models")
  return props ? heaven.with(props) : heaven
}
