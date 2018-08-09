.PHONY: lib action

BINDIR=node_modules/.bin
TSC=$(BINDIR)/tsc

ARG=$(filter-out $@,$(MAKECMDGOALS))

PACKAGES := action

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
		$(TSC) --project $(ARG) --outDir $(ARG)/lib; \
		echo "✓ Compiled TypeScript to lib\n"; \
	fi

# catch and do nothing
action:
	@:
