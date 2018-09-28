.PHONY: lib action screen speech sound run 3rdparty/cycle-posenet-driver

BINDIR=node_modules/.bin
BUMP=.scripts/bump.js
JASE=$(BINDIR)/jase

ARG=$(filter-out $@,$(MAKECMDGOALS))

PACKAGES := action screen speech sound run 3rdparty/cycle-posenet-driver

all:
	@echo "npm install"
	@npm install
	@echo ""
	@for d in $(PACKAGES); do \
		echo "$$d: npm install"; \
		cd $$d; npm install; cd ..; \
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
		rm -rf $(ARG)/lib; \
		mkdir -p $(ARG)/lib; \
		pushd .; cd $(ARG); \
		npm run build:cjs; \
		npm run build:es6; \
		popd; \
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
		pushd . &&gs cd $(ARG) && npm run build:doc && popd && \
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
		pushd . && cd $(ARG) && npm run test && popd && \
		echo "✓ Tested $(ARG)"; \
	fi

postbump:
	pushd . && cd $(ARG) && rm -rf node_modules package-lock.json && npm install && popd && \
	make lib $(ARG) && \
	git add -A && git commit -m "Release $(ARG) $(shell cat $(ARG)/package.json | $(JASE) version)" && \
	pushd . && cd $(ARG) && npm publish --access public && popd;

release-patch:
	@if [ "$(ARG)" = "" ]; then \
		echo "Error: please call 'make release-patch' with an argument, like 'make release-patch action'"; \
	else \
		$(BUMP) $(ARG)/package.json --patch; \
		make postbump $(ARG); \
		echo "✓ Released new patch for $(ARG)"; \
	fi

# catch and do nothing
action:
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
