#!/bin/bash
# Installs the pre-push safety hook. Run once per clone: bash AI/scripts/maintenance/install-hook.sh
TOP=$(git rev-parse --show-toplevel) || exit 1
HOOK="$TOP/.git/hooks/pre-push"
cat > "$HOOK" << 'HOOK_EOF'
#!/bin/bash
bash "$(git rev-parse --show-toplevel)/AI/scripts/maintenance/safe-check.sh" || {
  echo "⛔ Push blocked. Fix the issues above, or bypass once with: git push --no-verify"
  exit 1
}
HOOK_EOF
chmod +x "$HOOK"
echo "✅ pre-push hook installed at $HOOK"
