#!/usr/bin/env bash
set -euo pipefail

# Independent collectors may finish between our fetch and our push.
for attempt in 1 2 3 4 5; do
    if ! git pull --rebase origin main; then
        git rebase --abort 2>/dev/null || true
        echo 'Rebase conflict; stopping without overwriting remote data' >&2
        exit 1
    fi
    if git push origin HEAD:main; then
        exit 0
    fi
    sleep "$((attempt * 2 + RANDOM % 4))"
done
echo "Could not publish the update after five attempts" >&2
exit 1
