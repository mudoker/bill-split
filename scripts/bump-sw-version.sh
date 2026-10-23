#!/usr/bin/env bash
# scripts/bump-sw-version.sh
# Increments the ledger-vN cache version in public/sw.js and stages the file.
# Usage:
#   scripts/bump-sw-version.sh [patch|minor|major|--patch|--minor|--major]

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
SW_FILE="$REPO_ROOT/public/sw.js"
BUMP_ARG="${1:-${VERSION_BUMP:-patch}}"
BUMP_KIND="${BUMP_ARG#--}"

if [[ -z "$BUMP_KIND" ]]; then
  BUMP_KIND="patch"
fi

case "$BUMP_KIND" in
  major|minor|patch)
    ;;
  *)
    echo "❌  bump-sw-version: Unknown bump kind '$BUMP_ARG'. Use patch, minor, or major."
    exit 1
    ;;
esac

if [[ ! -f "$SW_FILE" ]]; then
  echo "⚠️  bump-sw-version: $SW_FILE not found, skipping."
  exit 0
fi

CURRENT=$(grep -oE 'SW_VERSION = "[0-9]+\.[0-9]+\.[0-9]+"' "$SW_FILE" | head -1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')

if [[ -z "$CURRENT" ]]; then
  echo "⚠️  bump-sw-version: Could not find SW_VERSION in $SW_FILE, skipping."
  exit 0
fi

IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT"

case "$BUMP_KIND" in
  major)
    NEXT="$((MAJOR + 1)).0.0"
    ;;
  minor)
    NEXT="${MAJOR}.$((MINOR + 1)).0"
    ;;
  patch)
    NEXT="${MAJOR}.${MINOR}.$((PATCH + 1))"
    ;;
esac

sed -i "s/SW_VERSION = \"${CURRENT}\"/SW_VERSION = \"${NEXT}\"/" "$SW_FILE"

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git add "$SW_FILE"
fi

echo "🔄  PWA cache bumped (${BUMP_KIND}): ledger-v${CURRENT} → ledger-v${NEXT}"
