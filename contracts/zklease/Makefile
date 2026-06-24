.PHONY: all build test clean deploy fmt help

TARGET      := wasm32v1-none
BUILD_DIR   := target/$(TARGET)/release
CONTRACT    := $(BUILD_DIR)/zklease.wasm

help:
	@echo "ZKLease Soroban Contract"
	@echo ""
	@echo "Targets:"
	@echo "  build       Build the contract wasm"
	@echo "  test        Run unit tests"
	@echo "  clean       Remove build artifacts"
	@echo "  fmt         Format Rust source code"
	@echo "  deploy      Deploy contract (needs soroban-cli)"
	@echo "  all         Build + test"

all: build test

build:
	rustup target add $(TARGET) 2>/dev/null || true
	cargo build --target $(TARGET) --release
	@ls -lh $(CONTRACT)

test:
	cargo test

clean:
	cargo clean

fmt:
	cargo fmt

deploy: build
	soroban contract deploy \
		--wasm $(CONTRACT) \
		$(ARGS)
