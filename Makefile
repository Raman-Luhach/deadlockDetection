# Deadlock Detection System
# Makefile for building the project

# Compiler settings
CC = gcc
CFLAGS = -Wall -Wextra -std=c99
DEBUG_FLAGS = -g -DDEBUG

# Directories
SRC_DIR = src
BUILD_DIR = build

# Source files (CLI)
SRCS = $(SRC_DIR)/main.c $(SRC_DIR)/deadlock_detector.c $(SRC_DIR)/rag.c
HEADERS = $(SRC_DIR)/deadlock_detector.h $(SRC_DIR)/rag.h

# API worker sources (no main.c; used by Node backend)
API_WORKER_SRCS = $(SRC_DIR)/api_worker.c $(SRC_DIR)/deadlock_detector.c $(SRC_DIR)/rag.c

# Output binaries
TARGET = deadlock_detector
API_WORKER = api_worker

# Default target
all: $(TARGET)

# Build the CLI executable
$(TARGET): $(SRCS) $(HEADERS)
	$(CC) $(CFLAGS) -o $(TARGET) $(SRCS)
	@echo "Build successful! Run with: ./$(TARGET)"

# Build the API worker (for Node backend: stdin text protocol, stdout JSON)
$(API_WORKER): $(API_WORKER_SRCS) $(HEADERS)
	$(CC) $(CFLAGS) -o $(API_WORKER) $(API_WORKER_SRCS)
	@echo "API worker built. Run from api/ with: node ... (server uses ../api_worker)"

# Debug build
debug: $(SRCS) $(HEADERS)
	$(CC) $(CFLAGS) $(DEBUG_FLAGS) -o $(TARGET) $(SRCS)
	@echo "Debug build successful!"

# Clean build artifacts
clean:
	rm -f $(TARGET) $(API_WORKER)
	rm -rf $(BUILD_DIR)
	@echo "Cleaned build artifacts."

# Run the program
run: $(TARGET)
	./$(TARGET)

# Rebuild from scratch
rebuild: clean all

# Help target
help:
	@echo "Deadlock Detection System - Build Commands"
	@echo "==========================================="
	@echo "  make        - Build the project"
	@echo "  make run    - Build and run the project"
	@echo "  make clean  - Remove build artifacts"
	@echo "  make debug  - Build with debug symbols"
	@echo "  make rebuild- Clean and rebuild"
	@echo "  make help   - Show this help message"
	@echo "  make api_worker - Build API worker binary (for Node backend)"

.PHONY: all clean run debug rebuild help api_worker
