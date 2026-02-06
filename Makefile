# Deadlock Detection System
# Makefile for building the project

# Compiler settings
CC = gcc
CFLAGS = -Wall -Wextra -std=c99
DEBUG_FLAGS = -g -DDEBUG

# Directories
SRC_DIR = src
BUILD_DIR = build

# Source files
SRCS = $(SRC_DIR)/main.c $(SRC_DIR)/deadlock_detector.c $(SRC_DIR)/rag.c
HEADERS = $(SRC_DIR)/deadlock_detector.h $(SRC_DIR)/rag.h

# Output binary
TARGET = deadlock_detector

# Default target
all: $(TARGET)

# Build the executable
$(TARGET): $(SRCS) $(HEADERS)
	$(CC) $(CFLAGS) -o $(TARGET) $(SRCS)
	@echo "Build successful! Run with: ./$(TARGET)"

# Debug build
debug: $(SRCS) $(HEADERS)
	$(CC) $(CFLAGS) $(DEBUG_FLAGS) -o $(TARGET) $(SRCS)
	@echo "Debug build successful!"

# Clean build artifacts
clean:
	rm -f $(TARGET)
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

.PHONY: all clean run debug rebuild help
