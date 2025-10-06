#!/usr/bin/env bash
# Script de build pour Render

echo "👉 Installation des dépendances..."
npm install

echo "👉 Génération du client Prisma..."
npx prisma generate

echo "👉 Compilation TypeScript..."
npx tsc

echo "✅ Build terminé avec succès."
