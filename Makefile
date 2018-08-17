.PHONY: lib action

BINDIR=node_modules/.bin
TSC=$(BINDIR)/tsc

ARG=$(filter-out $@,$(MAKECMDGOALS))

PACKAGES := action screen speech sound vision

all:
	@echo $(foo)
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
		rm -rf $(ARG)/lib/; \
		mkdir -p $(ARG)/lib; \
		$(TSC) --project $(ARG) --module commonjs --outDir $(ARG)/lib/cjs ;\
		$(TSC) --project $(ARG) --module es6 --outDir $(ARG)/lib/es6 ;\
		echo "✓ Compiled TypeScript to lib\n"; \
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

vision:
	@:
