# Discord Role Guardian Bot - Makefile
# Author: nayandas69
# Description: Automation for bot setup and execution

.PHONY: help install start dev clean setup run

# Default target - shows help
help:
	@echo "\033[1;36m=== Discord Role Guardian Bot - Available Commands ===\033[0m"
	@echo ""
	@echo "\033[1;32mmake setup\033[0m     - Install dependencies and prepare bot"
	@echo "\033[1;32mmake run\033[0m       - Install dependencies and start bot (one command)"
	@echo "\033[1;32mmake install\033[0m   - Install npm dependencies only"
	@echo "\033[1;32mmake start\033[0m     - Start the bot (production mode)"
	@echo "\033[1;32mmake dev\033[0m       - Start the bot (development mode with auto-restart)"
	@echo "\033[1;32mmake clean\033[0m     - Remove node_modules and package-lock.json"
	@echo ""
	@echo "\033[1;33mQuick Start: make run\033[0m"
	@echo ""

# Install all dependencies
install:
	@echo "\033[1;36m[INSTALLING] Installing npm dependencies...\033[0m"
	npm install
	@echo "\033[1;32m[SUCCESS] Dependencies installed successfully!\033[0m"

# Start the bot in production mode
start:
	@echo "\033[1;36m[STARTING] Launching Discord Role Guardian Bot...\033[0m"
	npm start

# Start the bot in development mode with auto-restart
dev:
	@echo "\033[1;36m[DEV MODE] Starting bot with auto-restart...\033[0m"
	npm run dev

# Setup: Install dependencies
setup: install
	@echo "\033[1;32m[SUCCESS] Bot setup complete!\033[0m"
	@echo "\033[1;33m[INFO] Don't forget to configure your .env file before starting!\033[0m"

# Run: Install and start in one command
run: install
	@echo "\033[1;36m[LAUNCHING] Starting bot...\033[0m"
	npm start

# Clean: Remove installed dependencies
clean:
	@echo "\033[1;33m[CLEANING] Removing node_modules and lock files...\033[0m"
	rm -rf node_modules package-lock.json
	@echo "\033[1;32m[SUCCESS] Cleanup complete!\033[0m"
