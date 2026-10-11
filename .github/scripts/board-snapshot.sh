#!/usr/bin/env bash
# Prints the current state of the team's GitHub Project as CSV, one row per card.
# Each daily run is kept on the `metrics` branch; docs/guides/board-metrics.md explains how they are used.
#
# Skips pull requests and the iterations used before the board was formalized.
# Needs GH_TOKEN with read:project (a classic PAT: GITHUB_TOKEN cannot read user-owned projects).
set -euo pipefail

owner="${PROJECT_OWNER:-dvillas28}"
number="${PROJECT_NUMBER:-3}"
excluded_iterations='["Semana 0 E2", "Semana 1"]'
snapshot_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Small pages: larger ones hit 504s on this project.
query='query($owner: String!, $number: Int!, $cursor: String) {
  user(login: $owner) {
    projectV2(number: $number) {
      items(first: 25, after: $cursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          content {
            __typename
            ... on Issue { number title state createdAt closedAt }
            ... on DraftIssue { title createdAt }
          }
          fieldValues(first: 30) {
            nodes {
              ... on ProjectV2ItemFieldSingleSelectValue { field { ... on ProjectV2FieldCommon { name } } name }
              ... on ProjectV2ItemFieldMultiSelectValue { field { ... on ProjectV2FieldCommon { name } } value }
              ... on ProjectV2ItemFieldIterationValue { field { ... on ProjectV2FieldCommon { name } } title }
              ... on ProjectV2ItemFieldNumberValue { field { ... on ProjectV2FieldCommon { name } } number }
              ... on ProjectV2ItemFieldUserValue { field { ... on ProjectV2FieldCommon { name } } users(first: 10) { nodes { login } } }
            }
          }
        }
      }
    }
  }
}'

fetch_page() {
  local args=(-f query="$query" -f owner="$owner" -F number="$number")
  [ -n "$1" ] && args+=(-f cursor="$1")
  for attempt in 1 2 3 4; do
    if gh api graphql "${args[@]}"; then return; fi
    echo "attempt $attempt failed, retrying" >&2
    sleep $((attempt * 10))
  done
  return 1
}

items=$(mktemp)
trap 'rm -f "$items"' EXIT
cursor=""
while :; do
  page=$(fetch_page "$cursor")
  jq -c '.data.user.projectV2.items.nodes[]' <<<"$page" >>"$items"
  [ "$(jq -r '.data.user.projectV2.items.pageInfo.hasNextPage' <<<"$page")" = true ] || break
  cursor=$(jq -r '.data.user.projectV2.items.pageInfo.endCursor' <<<"$page")
done

# One object per card, with field values flattened by field name.
cards=$(jq -s --argjson excluded "$excluded_iterations" '
  map(
    . as $item
    | ($item.fieldValues.nodes | map(select(.field.name))
       | map({ (.field.name): (.name // .value // .title // .number // ([.users.nodes[]?.login] | join(" "))) })
       | add // {}) as $f
    | select($item.content.__typename == "Issue" or $item.content.__typename == "DraftIssue")
    | select(($excluded | index($f["Semana"])) | not)
    | $f + { item_id: $item.id, kind: $item.content.__typename } + ($item.content | { number, title, state, createdAt, closedAt })
  )
' "$items")

# Metrics assume one Tipo per card.
jq -r '.[] | select((.Tipo // "") | contains(",")) | "::warning::card with more than one Tipo: \(.title)"' <<<"$cards" >&2

jq -r --arg at "$snapshot_at" '
  ["snapshot_at", "item_id", "kind", "number", "title", "state", "created_at", "closed_at",
   "status", "semana", "tipo", "area", "priority", "estimate_h", "real_h", "assignees", "plan_id"],
  (.[] | [$at, .item_id, .kind, .number, .title, .state, .createdAt, .closedAt,
          .Status, .Semana, .Tipo, .["Área"], .Priority, .["Estimate (h)"], .["Real (h)"], .Assignees, .ID])
  | @csv
' <<<"$cards"
