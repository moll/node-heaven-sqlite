var O = require("oolong")
var sql = require("sqlate")
var demand = require("must")
var SQLITE_MAX_VARIABLE_NUMBER = 999

var TABLE_DDL = sql`
	CREATE TEMPORARY TABLE "models" (
		"id" INTEGER PRIMARY KEY NOT NULL,
		"name" TEXT DEFAULT '',
		"age" INTEGER DEFAULT 0,

		CONSTRAINT models_max_age CHECK (age < 100)
	)
`

class Model {
	// Saving attributes to this.attributes catches double model initialization.
	constructor(attrs) { this.attributes = attrs || {} }
	set(attrs) { O.assign(this.attributes, attrs); return this }
	toJSON() { return O.clone(this.attributes) }
}

module.exports = function(SqliteHeaven, db, execute) {
	class HeavenOnTest extends SqliteHeaven {
		assign(model, attrs) { return model.set(attrs) }

		// As we've got attributes in a nested object, model identification that
		// bypasses Heaven.prototype.identify gets spotted.
		identify(model) {
			if (model instanceof this.model) return model.attributes[this.idAttribute]
			else return model[this.idAttribute]
		}
	}

	beforeEach(function() { return execute(sql`BEGIN`) })
	afterEach(function() { return execute(sql`ROLLBACK`) })

	var ROWS = [
		{id: 1, name: "Mike", age: 13},
		{id: 2, name: "John", age: 13},
		{id: 3, name: "Mike", age: 42}
	]

	describe("as SqliteHeaven", function() {
		describe("new", function() {
			it("must be an instance of Heaven", function() {
				new SqliteHeaven().must.be.an.instanceof(SqliteHeaven)
			})

			it("must set model to Object by default", function() {
				new SqliteHeaven().model.must.equal(Object)
			})

			it("must set model, sqlite and table when given as arguments",
				function() {
				var sqlite = {}
				var heaven = new SqliteHeaven(Model, sqlite, "models")
				heaven.model.must.equal(Model)
				heaven.sqlite.must.equal(sqlite)
				heaven.table.must.equal("models")
			})
		})

		describe(".prototype.with", function() {
			it("must be an instance of Heaven", function() {
				new SqliteHeaven().with({}).must.be.an.instanceof(SqliteHeaven)
			})

			it("must set new model", function() {
				var heaven = new SqliteHeaven()
				heaven.model.must.equal(Object)
				heaven.with({model: Model}).model.must.equal(Model)
			})

			it("must set new idAttribute", function() {
				var heaven = new SqliteHeaven().with({idAttribute: "age"})
				heaven.idAttribute.must.equal("age")
			})

			it("must set new idColumn", function() {
				var heaven = new SqliteHeaven().with({idColumn: "age"})
				heaven.idColumn.must.equal("age")
			})

			it("must set a new Sqlite instance", function() {
				var newSqlite = {}
				var heaven = new SqliteHeaven().with({sqlite: newSqlite})
				heaven.sqlite.must.equal(newSqlite)
			})

			it("must set new table", function() {
				var heaven = new SqliteHeaven().with({table: "new_models"})
				heaven.table.must.equal("new_models")
			})
		})

		describe(".prototype.search", function() {
			beforeEach(execute.bind(null, TABLE_DDL))
			beforeEach(insert.bind(null, "models", ROWS))

			it("must throw TypeError given undefined", function() {
				var err
				try { create().search(undefined) } catch (ex) { err = ex }
				err.must.be.an.error(TypeError, /^Bad Query: /)
			})

			it("must throw TypeError given null", function() {
				var err
				try { create().search(null) } catch (ex) { err = ex }
				err.must.be.an.error(TypeError, /^Bad Query: /)
			})

			it("must throw TypeError given an object", function() {
				var err
				try { create().search({}) } catch (ex) { err = ex }
				err.must.be.an.error(TypeError, /^Bad Query: /)
			})

			describe("given a numeric id", function() {
				it("must resolve with an empty array if none returned",
					async function() {
					demand(await create().search(42)).eql([])
				})

				it("must resolve with models queried by idColumn", async function() {
					demand(await create({idColumn: "age"}).search(13)).eql([
						new Model({id: 1, name: "Mike", age: 13}),
						new Model({id: 2, name: "John", age: 13})
					])
				})
			})

			describe("given a string id", function() {
				it("must resolve with empty array if none returned", async function() {
					demand(await create({idColumn: "name"}).search("Rob")).eql([])
				})

				it("must resolve with models queried by idColumn", async function() {
					demand(await create({idColumn: "name"}).search("Mike")).eql([
						new Model({id: 1, name: "Mike", age: 13}),
						new Model({id: 3, name: "Mike", age: 42})
					])
				})

				it("must query given \"=\"", async function() {
					await execute(sql`INSERT INTO models (name, age) VALUES ('=', 99)`)
					var model = await create({idColumn: "name"}).search("=")
					model.must.eql([new Model({id: 4, name: "=", age: 99})])
				})
			})

			describe("given a model", function() {
				it("must resolve with an empty array if none returned",
					async function() {
					demand(await create().search(new Model({id: 4}))).eql([])
				})

				it("must resolve with models queried by idColumn", async function() {
					var heaven = create({idAttribute: "age", idColumn: "age"})
					var model = new Model({age: 42})
					var models = await heaven.search(model)
					models.must.eql([new Model({id: 3, name: "Mike", age: 42})])
					models[0].must.equal(model)
				})
			})

			describe("given Sql", function() {
				it("must resolve with models", async function() {
					var models = await create().search(sql`
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
					err.must.be.an.error(TypeError, /^Bad Query in Array: /)
				})

				it("must throw TypeError given null in array", function() {
					var err
					try { create().search([null]) } catch (ex) { err = ex }
					err.must.be.an.error(TypeError, /^Bad Query in Array: /)
				})

				it("must throw TypeError given an object in array", function() {
					var err
					try { create().search([{}]) } catch (ex) { err = ex }
					err.must.be.an.error(TypeError, /^Bad Query in Array: /)
				})

				it("must throw TypeError given numeric and string ids", function() {
					var err
					try { create().search([1, "John"]) } catch (ex) { err = ex }
					err.must.be.an.error(TypeError, "Mixed Query in Array")
				})

				it("must resolve with empty array given an empty array",
					async function() {
					demand(await create().search([])).eql([])
				})
			})

			describe("given an array of numeric ids", function() {
				it("must resolve with empty array if no ids match", async function() {
					demand(await create().search([5, 6, 7])).eql([])
				})

				it("must resolve with models given numeric ids", async function() {
					await execute(sql`INSERT INTO models (name, age) VALUES ('Rob', 55)`)

					demand(await create({idColumn: "age"}).search([42, 55])).eql([
						new Model({id: 3, name: "Mike", age: 42}),
						new Model({id: 4, name: "Rob", age: 55})
					])
				})
			})

			describe("given an array of string ids", function() {
				it("must resolve with models given string ids", async function() {
					await execute(sql`INSERT INTO models (name, age) VALUES ('Rob', 55)`)

					var heaven = create({idColumn: "name"})
					demand(await heaven.search(["John", "Rob"])).eql([
						new Model({id: 2, name: "John", age: 13}),
						new Model({id: 4, name: "Rob", age: 55})
					])
				})
			})

			describe("given an array of models", function() {
				it("must resolve with models given models", async function() {
					var a = new Model({id: 1})
					var b = new Model({id: 3})

					var models = await create().search([a, b])
					models.length.must.equal(2)
					models[0].must.equal(a)
					models[1].must.equal(b)

					a.must.eql(new Model({id: 1, name: "Mike", age: 13}))
					b.must.eql(new Model({id: 3, name: "Mike", age: 42}))
				})
			})
		})

		describe(".prototype.read", function() {
			beforeEach(execute.bind(null, TABLE_DDL))
			beforeEach(insert.bind(null, "models", ROWS))

			it("must throw TypeError given undefined", function() {
				var err
				try { create().read(undefined) } catch (ex) { err = ex }
				err.must.be.an.error(TypeError, /^Bad Query: /)
			})

			it("must throw TypeError given null", function() {
				var err
				try { create().read(null) } catch (ex) { err = ex }
				err.must.be.an.error(TypeError, /^Bad Query: /)
			})

			it("must throw TypeError given an object", function() {
				var err
				try { create().read({}) } catch (ex) { err = ex }
				err.must.be.an.error(TypeError, /^Bad Query: /)
			})

			it("must throw TypeError given an array", function() {
				var err
				try { create().read([]) } catch (ex) { err = ex }
				err.must.be.an.error(TypeError, /^Bad Query: /)
			})

			describe("given a numeric id", function() {
				it("must resolve with null if none returned", async function() {
					demand(await create().read(42)).be.null()
				})

				it("must resolve with model queried by idColumn", async function() {
					var model = await create({idColumn: "age"}).read(13)
					model.must.eql(new Model({id: 1, name: "Mike", age: 13}))
				})
			})

			describe("given a string id", function() {
				it("must resolve with null if none returned", async function() {
					demand(await create({idColumn: "name"}).read("Rob")).be.null()
				})

				it("must resolve with model queried by idColumn", async function() {
					var heaven = create({idColumn: "name"})
					var model = await heaven.read("Mike")
					model.must.eql(new Model({id: 1, name: "Mike", age: 13}))
				})

				it("must query given \"=\"", async function() {
					await execute(sql`INSERT INTO models (name, age) VALUES ('=', 99)`)
					var model = await create({idColumn: "name"}).read("=")
					model.must.eql(new Model({id: 4, name: "=", age: 99}))
				})
			})

			describe("given a model", function() {
				it("must resolve with null if none returned", async function() {
					demand(await create().read(new Model({id: 4}))).be.null()
				})

				it("must resolve with model queried by idColumn", async function() {
					var heaven = create().with({idAttribute: "age", idColumn: "age"})
					var model = new Model({age: 42})
					demand(await heaven.read(model)).equal(model)
					model.must.eql(new Model({id: 3, name: "Mike", age: 42}))
				})
			})

			describe("given Sql", function() {
				it("must resolve with model", async function() {
					var model = await create().read(sql`
						SELECT * FROM models WHERE age < 15
					`)

					model.must.eql(new Model({id: 1, name: "Mike", age: 13}))
				})
			})
		})

		describe(".prototype.create", function() {
			beforeEach(execute.bind(null, TABLE_DDL))

			it("must throw TypeError given undefined", function() {
				var err
				try { create().create(undefined) } catch (ex) { err = ex }
				err.must.be.an.error(TypeError, /^Bad Attributes: /)
			})

			it("must throw TypeError given null", function() {
				var err
				try { create().create(null) } catch (ex) { err = ex }
				err.must.be.an.error(TypeError, /^Bad Attributes: /)
			})

			// Ensures exceptions from the creation promise get propagated correctly.
			it("must throw error on constraint violation", async function() {
				var err
				try { await create().create([{name: "Mike", age: 101}]) }
				catch (ex) { err = ex }
				err.must.be.an.error(/CHECK constraint failed/)
				demand(await execute(sql`SELECT * FROM models`)).eql([])
			})

			describe("given attributes", function() {
				it("must create model", async function() {
					var model = await create().create({name: "John", age: 13})
					var rows = await execute(sql`SELECT * FROM models`)
					rows.must.eql([{id: 1, name: "John", age: 13}])
					model.must.eql({id: 1, name: "John", age: 13})
				})

				it("must create model given inherited attributes", async function() {
					var model = await create().create(Object.create({
						name: "John",
						age: 13
					}))

					var rows = await execute(sql`SELECT * FROM models`)
					rows.must.eql([{id: 1, name: "John", age: 13}])
					model.must.eql({id: 1, name: "John", age: 13})
				})

				it("must create model given empty attributes", async function() {
					var model = await create().create({})
					var rows = await execute(sql`SELECT * FROM models`)
					rows.must.eql([{id: 1, name: "", age: 0}])
					model.must.eql({id: 1, name: "", age: 0})
				})
			})

			describe("given a model", function() {
				it("must create model", async function() {
					var model = await create().create(new Model({name: "John", age: 13}))
					var rows = await execute(sql`SELECT * FROM models`)
					rows.must.eql([{id: 1, name: "John", age: 13}])
					model.must.eql(new Model({id: 1, name: "John", age: 13}))
				})
			})

			describe("given an array", function() {
				it("must throw TypeError given undefined", function() {
					var err
					try { create().create([undefined]) } catch (ex) { err = ex }
					err.must.be.an.error(TypeError, /^Bad Attributes: /)
				})

				it("must throw TypeError given undefined and object array", function() {
					var err
					try { create().create([undefined, {}]) } catch (ex) { err = ex }
					err.must.be.an.error(TypeError, /^Bad Attributes: /)
				})

				it("must throw TypeError given null", function() {
					var err
					try { create().create([null]) } catch (ex) { err = ex }
					err.must.be.an.error(TypeError, /^Bad Attributes: /)
				})

				it("must throw TypeError given null and object", function() {
					var err
					try { create().create([null, {}]) } catch (ex) { err = ex }
					err.must.be.an.error(TypeError, /^Bad Attributes: /)
				})

				it("must not create models given an empty array", async function() {
					var models = await create().create([])
					demand(await execute(sql`SELECT * FROM models`)).eql([])
					models.must.eql([])
				})

				it("must create model given empty attributes", async function() {
					var heaven = create()
					var model = await heaven.create([{}])

					var rows = await execute(sql`SELECT * FROM models`)
					rows.must.eql([{id: 1, name: "", age: 0}])
					model.must.eql([{id: 1, name: "", age: 0}])
				})

				it("must create model given empty model", async function() {
					var heaven = create()
					var model = await heaven.create([new Model])

					var rows = await execute(sql`SELECT * FROM models`)
					rows.must.eql([{id: 1, name: "", age: 0}])
					model.must.eql([new Model({id: 1, name: "", age: 0})])
				})

				it("must create model", async function() {
					var models = await create().create([new Model({
						name: "John",
						age: 13
					})])

					var rows = await execute(sql`SELECT * FROM models`)
					rows.must.eql([{id: 1, name: "John", age: 13}])
					models.must.eql([new Model({id: 1, name: "John", age: 13})])
				})

				it("must create models", async function() {
					var models = await create().create([
						new Model({name: "John", age: 13}),
						new Model({name: "Mike", age: 42})
					])

					demand(await execute(sql`SELECT * FROM models`)).eql([
						{id: 1, name: "John", age: 13},
						{id: 2, name: "Mike", age: 42}
					])

					models.must.eql([
						new Model({id: 1, name: "John", age: 13}),
						new Model({id: 2, name: "Mike", age: 42})
					])
				})

				it("must create models given all empty attributes", async function() {
					var models = await create().create([{}, {}, {}])

					demand(await execute(sql`SELECT * FROM models`)).eql([
						{id: 1, name: "", age: 0},
						{id: 2, name: "", age: 0},
						{id: 3, name: "", age: 0}
					])

					models.must.eql([
						{id: 1, name: "", age: 0},
						{id: 2, name: "", age: 0},
						{id: 3, name: "", age: 0}
					])
				})

				it("must create models given one empty attributes", async function() {
					var models = await create().create([{name: "John"}, {}, {age: 42}])

					demand(await execute(sql`SELECT * FROM models`)).eql([
						{id: 1, name: "John", age: 0},
						{id: 2, name: "", age: 0},
						{id: 3, name: "", age: 42}
					])

					models.must.eql([
						{id: 1, name: "John", age: 0},
						{id: 2, name: "", age: 0},
						{id: 3, name: "", age: 42}
					])
				})

				it("must return models in order given models", async function() {
					var models = await create().create([
						new Model({name: "Mike", age: 42}),
						new Model({name: "John", age: 13})
					])

					demand(await execute(sql`SELECT * FROM models`)).eql([
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

		describe(".prototype.create_", function() {
			beforeEach(execute.bind(null, TABLE_DDL))

			it("must throw TypeError given undefined", function() {
				var err
				try { create().create_(undefined) } catch (ex) { err = ex }
				err.must.be.an.error(TypeError, /^Bad Attributes: /)
			})

			it("must throw TypeError given null", function() {
				var err
				try { create().create_(null) } catch (ex) { err = ex }
				err.must.be.an.error(TypeError, /^Bad Attributes: /)
			})

			// Ensures exceptions from the creation promise get propagated correctly.
			it("must throw error on constraint violation", async function() {
				var err
				try { await create().create_([{name: "Mike", age: 101}]) }
				catch (ex) { err = ex }
				err.must.be.an.error(/CHECK constraint failed/)
				demand(await execute(sql`SELECT * FROM models`)).eql([])
			})

			describe("given attributes", function() {
				it("must create model", async function() {
					demand(await create().create_({name: "John", age: 13})).be.undefined()
					var rows = await execute(sql`SELECT * FROM models`)
					rows.must.eql([{id: 1, name: "John", age: 13}])
				})

				it("must create model given inherited attributes", async function() {
					await create().create_(Object.create({name: "John", age: 13}))
					var rows = await execute(sql`SELECT * FROM models`)
					rows.must.eql([{id: 1, name: "John", age: 13}])
				})

				it("must create model given empty attributes", async function() {
					demand(await create().create_({})).be.undefined()
					var rows = await execute(sql`SELECT * FROM models`)
					rows.must.eql([{id: 1, name: "", age: 0}])
				})
			})

			describe("given a model", function() {
				it("must create model", async function() {
					demand(await create().create_(new Model({
						name: "John",
						age: 13
					}))).be.undefined()

					var rows = await execute(sql`SELECT * FROM models`)
					rows.must.eql([{id: 1, name: "John", age: 13}])
				})
			})

			describe("given an array", function() {
				it("must throw TypeError given undefined", function() {
					var err
					try { create().create_([undefined]) } catch (ex) { err = ex }
					err.must.be.an.error(TypeError, /^Bad Attributes: /)
				})

				it("must throw TypeError given undefined and object array", function() {
					var err
					try { create().create_([undefined, {}]) } catch (ex) { err = ex }
					err.must.be.an.error(TypeError, /^Bad Attributes: /)
				})

				it("must throw TypeError given null", function() {
					var err
					try { create().create_([null]) } catch (ex) { err = ex }
					err.must.be.an.error(TypeError, /^Bad Attributes: /)
				})

				it("must throw TypeError given null and object", function() {
					var err
					try { create().create_([null, {}]) } catch (ex) { err = ex }
					err.must.be.an.error(TypeError, /^Bad Attributes: /)
				})

				it("must not create models given an empty array", async function() {
					demand(await create().create_([])).be.undefined()
					demand(await execute(sql`SELECT * FROM models`)).eql([])
				})

				it("must create model given empty attributes", async function() {
					var heaven = create()
					demand(await heaven.create_([{}])).be.undefined()

					var rows = await execute(sql`SELECT * FROM models`)
					rows.must.eql([{id: 1, name: "", age: 0}])
				})

				it("must create model given empty model", async function() {
					var heaven = create()
					demand(await heaven.create_([new Model])).be.undefined()

					var rows = await execute(sql`SELECT * FROM models`)
					rows.must.eql([{id: 1, name: "", age: 0}])
				})

				it("must create model", async function() {
					demand(await create().create_([new Model({
						name: "John",
						age: 13
					})])).be.undefined()

					var rows = await execute(sql`SELECT * FROM models`)
					rows.must.eql([{id: 1, name: "John", age: 13}])
				})

				it("must create models with matching attributes", async function() {
					demand(await create().create_([
						new Model({name: "John", age: 13}),
						new Model({name: "Mike", age: 42})
					])).be.undefined()

					demand(await execute(sql`SELECT * FROM models`)).eql([
						{id: 1, name: "John", age: 13},
						{id: 2, name: "Mike", age: 42}
					])
				})

				it("must create models with mismatching attributes", async function() {
					demand(await create().create_([
						new Model({name: "John"}),
						new Model({age: 42}),
						new Model
					])).be.undefined()

					demand(await execute(sql`SELECT * FROM models`)).eql([
						{id: 1, name: "John", age: null},
						{id: 2, name: null, age: 42},
						{id: 3, name: null, age: null}
					])
				})

				it("must create models given SQLITE_MAX_VARIABLE_NUMBER columns",
					async function() {
					demand(SQLITE_MAX_VARIABLE_NUMBER % 3).equal(0)

					var attrs = times(SQLITE_MAX_VARIABLE_NUMBER / 3, (i) => ({
						id: i,
						age: i % 100,
						name: "John " + i
					}))

					demand(await create().create_(attrs.map((attrs) => (
						new Model(attrs)
					)))).be.undefined()

					demand(await execute(sql`SELECT * FROM models`)).eql(attrs)
				})

				it("must create models given SQLITE_MAX_VARIABLE_NUMBER+1 columns",
					async function() {
					demand(SQLITE_MAX_VARIABLE_NUMBER % 3).equal(0)

					var attrs = times(SQLITE_MAX_VARIABLE_NUMBER / 3 + 1, (i) => ({
						id: i,
						age: i % 100,
						name: "John " + i
					}))

					demand(await create().create_(attrs.map((attrs) => (
						new Model(attrs)
					)))).be.undefined()

					demand(await execute(sql`SELECT * FROM models`)).eql(attrs)
				})

				it("must create models given all empty attributes", async function() {
					demand(await create().create_([{}, {}, {}])).be.undefined()

					demand(await execute(sql`SELECT * FROM models`)).eql([
						{id: 1, name: "", age: 0},
						{id: 2, name: "", age: 0},
						{id: 3, name: "", age: 0}
					])
				})

				it("must create models given one empty attributes", async function() {
					demand(await create().create_([
						{name: "John"},
						{},
						{age: 42}
					])).be.undefined()

					demand(await execute(sql`SELECT * FROM models`)).eql([
						{id: 1, name: "John", age: null},
						{id: 2, name: null, age: null},
						{id: 3, name: null, age: 42}
					])
				})
			})
		})

		describe(".prototype.update", function() {
			beforeEach(execute.bind(null, TABLE_DDL))
			beforeEach(insert.bind(null, "models", ROWS))

			it("must throw TypeError given undefined", function() {
				var err
				try { create().update(undefined, {name: "John"}) }
				catch (ex) { err = ex }
				err.must.be.an.error(TypeError, /^Bad Query: /)
			})

			it("must throw TypeError given null", function() {
				var err
				try { create().update(null, {name: "John"}) } catch (ex) { err = ex }
				err.must.be.an.error(TypeError, /^Bad Query: /)
			})

			it("must throw TypeError given an object", function() {
				var err
				try { create().update({}, {name: "John"}) } catch (ex) { err = ex }
				err.must.be.an.error(TypeError, /^Bad Query: /)
			})

			it("must throw TypeError given an array", function() {
				var err
				try { create().update([], {name: "John"}) } catch (ex) { err = ex }
				err.must.be.an.error(TypeError, /^Bad Query: /)
			})

			describe("given a numeric id and attributes", function() {
				it("must update models queried by idColumn", async function() {
					await create({idColumn: "age"}).update(13, {name: "Raul"})

					demand(await execute(sql`SELECT * FROM models`)).eql([
						{id: 1, name: "Raul", age: 13},
						{id: 2, name: "Raul", age: 13},
						{id: 3, name: "Mike", age: 42}
					])
				})

				it("must do nothing given empty attributes", async function() {
					await create().update(1, {})
					demand(await execute(sql`SELECT * FROM models`)).eql(ROWS)
				})
			})

			describe("given a string id and attributes", function() {
				it("must update models queried by idColumn", async function() {
					await create({idColumn: "name"}).update("Mike", {name: "Raul"})

					demand(await execute(sql`SELECT * FROM models`)).eql([
						{id: 1, name: "Raul", age: 13},
						{id: 2, name: "John", age: 13},
						{id: 3, name: "Raul", age: 42}
					])
				})

				it("must do nothing given empty attributes", async function() {
					await create().update("Mike", {})
					demand(await execute(sql`SELECT * FROM models`)).eql(ROWS)
				})
			})

			describe("given a model and attributes", function() {
				it("must update model queried by idColumn",
					async function() {
					var heaven = create({idAttribute: "age", idColumn: "age"})

					demand(await heaven.update(new Model({age: 13}), {
						name: "Raul"
					})).be.undefined()

					demand(await execute(sql`SELECT * FROM models`)).eql([
						{id: 1, name: "Raul", age: 13},
						{id: 2, name: "Raul", age: 13},
						{id: 3, name: "Mike", age: 42}
					])
				})

				it("must do nothing given empty attributes", async function() {
					demand(await create().update(new Model({id: 1}), {})).be.undefined()
					demand(await execute(sql`SELECT * FROM models`)).eql(ROWS)
				})
			})
		})

		describe(".prototype.delete", function() {
			beforeEach(execute.bind(null, TABLE_DDL))
			beforeEach(insert.bind(null, "models", ROWS))

			it("must throw TypeError given undefined", function() {
				var err
				try { create().delete(undefined) } catch (ex) { err = ex }
				err.must.be.an.error(TypeError, /^Bad Query: /)
			})

			it("must throw TypeError given null", function() {
				var err
				try { create().delete(null) } catch (ex) { err = ex }
				err.must.be.an.error(TypeError, /^Bad Query: /)
			})

			it("must throw TypeError given an object", function() {
				var err
				try { create().delete({}) } catch (ex) { err = ex }
				err.must.be.an.error(TypeError, /^Bad Query: /)
			})

			it("must throw TypeError given an array", function() {
				var err
				try { create().delete([]) } catch (ex) { err = ex }
				err.must.be.an.error(TypeError, /^Bad Query: /)
			})

			describe("given a numeric id and attributes", function() {
				it("must delete models queried by idColumn", async function() {
					demand(await create({idColumn: "age"}).delete(13)).be.undefined()

					demand(await execute(sql`SELECT * FROM models`)).eql([
						{id: 3, name: "Mike", age: 42}
					])
				})
			})

			describe("given a string id and attributes", function() {
				it("must delete models queried by idColumn", async function() {
					await create({idColumn: "name"}).delete("Mike")

					demand(await execute(sql`SELECT * FROM models`)).eql([
						{id: 2, name: "John", age: 13}
					])
				})
			})

			describe("given a model and attributes", function() {
				it("must delete model queried by idColumn", async function() {
					var heaven = create({idAttribute: "age", idColumn: "age"})
					await heaven.delete(new Model({age: 13}))

					demand(await execute(sql`SELECT * FROM models`)).eql([
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
}

function times(times, fn) {
	var results = new Array(times)
	for (var i = 0; i < times; ++i) results[i] = fn(i)
	return results
}
