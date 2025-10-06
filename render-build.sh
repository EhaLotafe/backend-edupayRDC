#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Build TypeScript
npm run build
