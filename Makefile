.PHONY: lib action screen speech sound 3rdparty/cycle-posenet-driver run

BINDIR=node_modules/.bin
TSC=$(BINDIR)/tsc

ARG=$(filter-out $@,$(MAKECMDGOALS))

PACKAGES := action screen speech sound 3rdparty/cycle-posenet-driver run

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
		$(TSC) --project $(ARG) --module commonjs --outDir $(ARG)/lib/cjs ;\
		$(TSC) --project $(ARG) --module es6 --outDir $(ARG)/lib/es6 ;\
		echo "✓ Compiled TypeScript to lib\n"; \
	fi

test:
	@if [ "$(ARG)" = "" ]; then \
		exitcode=0; \
		for d in $(PACKAGES); do \
			make test $$d || exitcode=$$?; \
		done; \
		exit $$exitcode; \
	else \
		cd $(ARG) && npm run test && cd .. &&\
		echo "✓ Tested $(ARG)" ;\
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

3rdparty/cycle-posenet-driver:
	@:

run:
	@:
