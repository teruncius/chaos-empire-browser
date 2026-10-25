# List available recipes
default:
    @just --list

# Start the Vite dev server
run:
    npm run dev

# Lint and type-check the app
lint:
    npm run lint
    npx tsc -b

# Format all source files
format:
    npm run format
