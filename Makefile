.PHONY: lib action screen speech sound run actionbank 3rdparty/cycle-posenet-driver 3rdparty/cycle-meyda-driver

ROOTDIR=$(shell pwd)
BINDIR=node_modules/.bin
BUMP=.scripts/bump.js
JASE=$(BINDIR)/jase

ARG=$(filter-out $@,$(MAKECMDGOALS))

PACKAGES := action screen speech sound run actionbank 3rdparty/cycle-posenet-driver 3rdparty/cycle-meyda-driver

all:
	@echo "npm ci"
	@npm ci
	@echo ""
	@for d in $(PACKAGES); do \
		echo "$$d: npm ci"; \
		cd $$d && npm ci && cd $(ROOTDIR) && \
		echo ""; \
	done
	@make lib

lib:
	@if [ "$(ARG)" = "" ]; then \
		for d in $(PACKAGES); do \
			echo "Compiling $$d"; \
			make lib $$d; \
		done; \
	else \
		rm -rf $(ARG)/lib && \
		mkdir -p $(ARG)/lib && \
		cd $(ARG) && \
		npm run build:cjs && \
		npm run build:es6 && \
		echo "✓ Compiled TypeScript to lib\n"; \
	fi

doc:
	@if [ "$(ARG)" = "" ]; then \
		exitcode=0; \
		for d in $(PACKAGES); do \
			make doc $$d || exitcode=$$?; \
		done; \
		exit $$exitcode; \
	else \
		cd $(ARG) && npm run build:doc && \
		echo "✓ Docs for $(ARG)"; \
	fi

test:
	@if [ "$(ARG)" = "" ]; then \
		exitcode=0; \
		for d in $(PACKAGES); do \
			make test $$d || exitcode=$$?; \
		done; \
		exit $$exitcode; \
	else \
		cd $(ARG) && npm run test && \
		echo "✓ Tested $(ARG)"; \
	fi

postbump:
	cd $(ARG) && rm -rf node_modules package-lock.json && npm ci && \
	cd $(ROOTDIR) && make lib $(ARG) && make doc $(ARG) && \
	git add -A && git commit -m "Release $(ARG) $(shell cat $(ARG)/package.json | $(JASE) version)" && \
	cd $(ROOTDIR) && cd $(ARG) && npm publish --access public;

release-patch:
	@if [ "$(ARG)" = "" ]; then \
		echo "Error: please call 'make release-patch' with an argument, like 'make release-patch action'"; \
	else \
		$(BUMP) $(ARG)/package.json --patch && \
		make postbump $(ARG) && \
		echo "✓ Released new patch for $(ARG)"; \
	fi

# catch and do nothing
action:
	@:

actionbank:
	@:

screen:
	@:

sound:
	@:

speech:
	@:

run:
	@:

3rdparty/cycle-posenet-driver:
	@:

3rdparty/cycle-meyda-driver:
	@:
