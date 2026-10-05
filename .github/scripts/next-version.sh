#!/usr/bin/env bash
# Prints the next version tag from Conventional Commits since the latest stable tag:
#   stable -> vX.Y.Z        (push to main)
#   dev    -> vX.Y.Z-dev.N  (push to dev)
# Prints nothing when there is nothing new to tag.
set -euo pipefail

channel="${1:-}"
if [ "$channel" != stable ] && [ "$channel" != dev ]; then
  echo "usage: next-version.sh stable|dev" >&2
  exit 2
fi

# Latest stable tag by version, not by reachability: main's merge commits never reach dev.
base=$(git tag --list 'v*' --sort=-v:refname | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | head -n1 || true)
base=${base:-v0.0.0}
range="$base..HEAD"
git rev-parse -q --verify "refs/tags/$base" >/dev/null || range=HEAD

subjects=$(git log --no-merges --format=%s "$range")
[ -n "$subjects" ] || exit 0

# Re-running on an already tagged dev commit must not create a second prerelease.
if [ "$channel" = dev ] && git tag --points-at HEAD | grep -qE '^v[0-9]+\.[0-9]+\.[0-9]+-dev\.[0-9]+$'; then
  exit 0
fi

if grep -qE '^[a-z]+(\([^)]*\))?!:' <<<"$subjects" ||
  git log --no-merges --format=%b "$range" | grep -qE '^BREAKING[ -]CHANGE:'; then
  bump="major"
elif grep -qE '^feat(\([^)]*\))?:' <<<"$subjects"; then
  bump="minor"
else
  bump="patch"
fi

IFS=. read -r major minor patch <<<"${base#v}"
# Before 1.0.0 a breaking change only bumps minor.
if [ "$bump" = major ] && [ "$major" -eq 0 ]; then
  bump="minor"
fi
case $bump in
  major) major=$((major + 1)) minor=0 patch=0 ;;
  minor) minor=$((minor + 1)) patch=0 ;;
  patch) patch=$((patch + 1)) ;;
esac
version="v$major.$minor.$patch"

if [ "$channel" = dev ]; then
  last=0
  for tag in $(git tag --list "$version-dev.*"); do
    n=${tag##*-dev.}
    if [[ $n =~ ^[0-9]+$ ]] && [ "$n" -gt "$last" ]; then
      last=$n
    fi
  done
  version="$version-dev.$((last + 1))"
fi

echo "$version"
