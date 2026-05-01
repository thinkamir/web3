#!/usr/bin/env bash
set -euo pipefail

REPO="${ALPHAQUEST_REPO:-/opt/data/repos/web3}"
LOG_DIR="${ALPHAQUEST_LOG_DIR:-/opt/data/claude-web3-logs}"
BASE_URL="${ANTHROPIC_BASE_URL:-http://api.flyamir.site:8317}"
MODEL="${CLAUDE_MODEL:-gpt-5.3-codex}"
KEY_HELPER="${FLYAMIR_KEY_HELPER:-/opt/data/home/.claude/flyamir-key-helper.sh}"
BRANCH_PREFIX="${ALPHAQUEST_BRANCH_PREFIX:-feat/alphaquest-mvp-multiagent}"
mkdir -p "$LOG_DIR"
cd "$REPO"

export ANTHROPIC_BASE_URL="$BASE_URL"
if [ -z "${ANTHROPIC_API_KEY:-}" ] && [ -x "$KEY_HELPER" ]; then
  export ANTHROPIC_API_KEY="$($KEY_HELPER)"
fi
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
# The current Linux runner does not have bubblewrap installed. Claude Code's
# env scrubber hard-fails without it before doing any work, so keep subprocess
# isolation off here while preserving explicit tool allowlists and .env deny
# rules in .claude/settings.local.json.
if command -v bwrap >/dev/null 2>&1; then
  export CLAUDE_CODE_SUBPROCESS_ENV_SCRUB="${CLAUDE_CODE_SUBPROCESS_ENV_SCRUB:-1}"
else
  export CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=0
fi

stamp() { date '+%Y-%m-%d %H:%M:%S'; }
log() { printf '[%s] %s\n' "$(stamp)" "$*" | tee -a "$LOG_DIR/orchestrator.log"; }
run() { log "RUN: $*"; "$@" 2>&1 | tee -a "$LOG_DIR/orchestrator.log"; }

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  log "ERROR: not a git repository: $REPO"
  exit 1
fi

current_branch="$(git branch --show-current || true)"
if [ "$current_branch" = "main" ] || [ -z "$current_branch" ]; then
  branch="${BRANCH_PREFIX}-$(date +%Y%m%d)"
  if git show-ref --quiet "refs/heads/$branch"; then
    run git checkout "$branch"
  else
    run git checkout -b "$branch"
  fi
else
  branch="$current_branch"
fi
log "Using branch: $branch"

# Never let the automation commit local credential/cache artifacts.
cleanup_unwanted_artifacts() {
  rm -f apps/web/tsconfig.tsbuildinfo apps/dashboard/tsconfig.tsbuildinfo apps/admin/tsconfig.tsbuildinfo 2>/dev/null || true
}

run_claude_task() {
  local name="$1"
  local prompt="$2"
  local allowed="$3"
  local logfile="$LOG_DIR/${name}-$(date +%Y%m%d-%H%M%S).json"
  log "Starting Claude task: $name"
  set +e
  claude --bare -p "$prompt" \
    --model "$MODEL" \
    --effort medium \
    --output-format json \
    --max-turns 12 \
    --max-budget-usd 2.50 \
    --settings .claude/settings.local.json \
    --allowedTools "$allowed" \
    > "$logfile" 2>&1
  local code=$?
  set -e
  log "Claude task finished: $name exit=$code log=$logfile"
  return 0
}

ALLOWED_DASH="Read,Grep,Glob,LS,Edit,MultiEdit,Write,Bash(pnpm --filter @alphaquest/dashboard *),Bash(pnpm install*),Bash(node *),Bash(npx *)"
ALLOWED_ADMIN="Read,Grep,Glob,LS,Edit,MultiEdit,Write,Bash(pnpm --filter @alphaquest/admin *),Bash(pnpm install*),Bash(node *),Bash(npx *)"
ALLOWED_API="Read,Grep,Glob,LS,Edit,MultiEdit,Write,Bash(pnpm --filter @alphaquest/api *),Bash(pnpm install*),Bash(node *),Bash(npx *)"
ALLOWED_CONTRACTS="Read,Grep,Glob,LS,Edit,MultiEdit,Write,Bash(pnpm --filter @alphaquest/contracts *),Bash(cd contracts && forge test*),Bash(forge test*),Bash(node *),Bash(npx *)"
ALLOWED_REVIEW="Read,Grep,Glob,LS,Bash(git status*),Bash(git diff*),Bash(pnpm --filter @alphaquest/web typecheck),Bash(pnpm --filter @alphaquest/dashboard typecheck),Bash(pnpm --filter @alphaquest/admin typecheck),Bash(pnpm --filter @alphaquest/api typecheck),Bash(pnpm --filter @alphaquest/api test),Bash(pnpm --filter @alphaquest/contracts test)"

PROMPT_DASH='Use @dashboard-ui-agent. Continue AlphaQuest MVP development for apps/dashboard only. Read AGENTS.md and CLAUDE.md. Implement the Agent 2 dashboard UI skeleton from docs/product/MVP_EXECUTION_PLAN.md with mock data, routes and reusable components. Keep changes scoped to apps/dashboard unless a tiny shared type/component change is unavoidable. Do not read .env files or secrets. Run pnpm --filter @alphaquest/dashboard typecheck and build if feasible. Return summary, changed files, tests run, limitations.'
PROMPT_ADMIN='Use @admin-ui-agent. Continue AlphaQuest MVP development for apps/admin only. Read AGENTS.md and CLAUDE.md. Implement the Agent 3 admin panel UI skeleton from docs/product/MVP_EXECUTION_PLAN.md with mock data, review tables, filters, action modal and audit drawer patterns. Keep changes scoped to apps/admin unless a tiny shared type/component change is unavoidable. Do not read .env files or secrets. Run pnpm --filter @alphaquest/admin typecheck and build if feasible. Return summary, changed files, tests run, limitations.'
PROMPT_API_AUTH='Use @api-auth-agent. Continue AlphaQuest MVP development for apps/api auth/user only. Read AGENTS.md and CLAUDE.md. Implement wallet nonce/login/refresh/me/profile foundations with Prisma models and unit tests. Preserve security rules and do not read .env files or secrets. Run db:generate after schema changes, then typecheck and tests. Return summary, changed files, tests run, limitations.'
PROMPT_API_PROJECT='Use @api-project-campaign-agent. Continue AlphaQuest MVP development for apps/api project/campaign only. Read AGENTS.md and CLAUDE.md. Implement project/campaign permissions, lifecycle status validation, Prisma models and tests. Preserve security rules and do not read .env files or secrets. Run db:generate after schema changes, then typecheck and tests. Return summary, changed files, tests run, limitations.'
PROMPT_CONTRACTS='Use @contracts-agent. Continue AlphaQuest MVP development for contracts/ only. Read AGENTS.md and CLAUDE.md. Implement or improve PrizeVault, DrawRoundManager, MerkleEntryVerifier and tests/compile verification for MVP reward pools. Avoid out-of-scope token issuance or gambling wording. Do not read .env files or secrets. Run pnpm --filter @alphaquest/contracts test and forge test if available. Return summary, changed files, tests run, limitations.'
PROMPT_REVIEW='Use @integration-review-agent. Review current AlphaQuest repository changes after the latest multi-agent cycle. Use read-only tools only. Check spec compliance, integration, type safety, security, MVP scope exclusions and validation status. Return PASS or REQUEST_CHANGES with concrete blockers and suggestions.'

# Run bounded concurrent work. UI lanes in parallel, backend lanes in parallel, contracts separately.
run_claude_task dashboard "$PROMPT_DASH" "$ALLOWED_DASH" &
pid_dash=$!
run_claude_task admin "$PROMPT_ADMIN" "$ALLOWED_ADMIN" &
pid_admin=$!
wait "$pid_dash" "$pid_admin" || true
cleanup_unwanted_artifacts

run_claude_task api-auth "$PROMPT_API_AUTH" "$ALLOWED_API" &
pid_auth=$!
run_claude_task api-project "$PROMPT_API_PROJECT" "$ALLOWED_API" &
pid_project=$!
wait "$pid_auth" "$pid_project" || true
cleanup_unwanted_artifacts

run_claude_task contracts "$PROMPT_CONTRACTS" "$ALLOWED_CONTRACTS" || true
cleanup_unwanted_artifacts

# Verification: do not fail the whole cycle immediately; collect evidence for commit message.
VERIFY_LOG="$LOG_DIR/verify-$(date +%Y%m%d-%H%M%S).log"
{
  echo "## verification $(stamp)"
  pnpm --filter @alphaquest/web typecheck || true
  pnpm --filter @alphaquest/dashboard typecheck || true
  pnpm --filter @alphaquest/admin typecheck || true
  pnpm --filter @alphaquest/api typecheck || true
  pnpm --filter @alphaquest/api test || true
  pnpm --filter @alphaquest/contracts test || true
} 2>&1 | tee "$VERIFY_LOG"
log "Verification log: $VERIFY_LOG"

run_claude_task integration-review "$PROMPT_REVIEW" "$ALLOWED_REVIEW" || true
cleanup_unwanted_artifacts

if git diff --quiet && git diff --cached --quiet; then
  log "No repository changes to commit."
  exit 0
fi

# Stage only project files. Exclude local build caches and generated tsbuildinfo.
git add AGENTS.md CLAUDE.md .claude/settings.local.json .claude/agents docs apps packages contracts services package.json pnpm-workspace.yaml pnpm-lock.yaml 2>/dev/null || true
git reset -- apps/web/tsconfig.tsbuildinfo apps/dashboard/tsconfig.tsbuildinfo apps/admin/tsconfig.tsbuildinfo 2>/dev/null || true

if git diff --cached --quiet; then
  log "No staged changes to commit after filtering."
  exit 0
fi

# Lightweight secret scan on staged added lines.
SECRET_PATTERN='(api_key|secret|password|token|passwd)[[:space:]]*[:=][[:space:]]*["'"'"'"'"'][^"'"'"'"'"']{8,}["'"'"'"'"']'
if git diff --cached | grep '^+' | grep -Ei "$SECRET_PATTERN" >/tmp/alphaquest-secret-scan.txt; then
  log "ERROR: potential secret detected in staged diff; not committing. See /tmp/alphaquest-secret-scan.txt"
  exit 2
fi

shortstat="$(git diff --cached --shortstat || true)"
commit_msg="chore: multi-agent AlphaQuest MVP progress

Automated 2-hour Claude Code multi-agent cycle.

Summary: ${shortstat:-project updates}

Validation log: $VERIFY_LOG
"
run git commit -m "$commit_msg"

# Push only after a successful commit.
if git remote get-url origin >/dev/null 2>&1; then
  set +e
  git push -u origin HEAD 2>&1 | tee -a "$LOG_DIR/orchestrator.log"
  push_code=${PIPESTATUS[0]}
  set -e
  if [ "$push_code" -ne 0 ]; then
    log "WARNING: git push failed with exit=$push_code. Commit remains local."
    exit "$push_code"
  fi
  log "Pushed branch $branch to origin."
fi
