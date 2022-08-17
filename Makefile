NODE = node
NODE_OPTS = --use-strict
NPM = npm
MOCHA = ./node_modules/.bin/_mocha
TEST = test/**/*_test.js
NPM_REBUILD = $(NPM) --ignore-scripts false rebuild --build-from-source

love:
	@echo "Feel like makin' love."

test:
	@$(NODE) $(NODE_OPTS) $(MOCHA) -R dot $(TEST)

spec:
	@$(NODE) $(NODE_OPTS) $(MOCHA) -R spec $(TEST)

autotest:
	@$(NODE) $(NODE_OPTS) $(MOCHA) -R dot --watch $(TEST)

autospec:
	@$(NODE) $(NODE_OPTS) $(MOCHA) -R spec --watch $(TEST)

pack:
	@file=$$(npm pack); echo "$$file"; tar tf "$$file"

publish:
	$(NPM) publish

tag:
	git tag "v$$($(NODE) -e 'console.log(require("./package").version)')"

rebuild:
	$(NPM_REBUILD) sqlite3
	cd node_modules/better-sqlite3 && \
	$(NPM) --ignore-scripts false run build-release

clean:
	-$(RM) *.tgz
	$(NPM) prune --production

.PHONY: love
.PHONY: test spec autotest autospec
.PHONY: pack publish tag
.PHONY: rebuild
.PHONY: clean
