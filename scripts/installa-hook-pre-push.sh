#!/usr/bin/env bash
# Installa "npm run verifica" (scripts/verifica.js) come git hook pre-push:
# da questo momento, "git push" da QUALUNQUE worktree di questo repository
# (compreso questo, nutriai-backend-notte) lancia prima il controllo, e si
# ferma senza spingere nulla se anche uno solo dei cinque passaggi fallisce.
#
# L'hook e' uno solo, condiviso da tutti i worktree (vive nella cartella
# .git comune, non in quella di un singolo worktree) - ma ad ogni push
# lavora sul worktree DA CUI si sta spingendo (git rev-parse --show-
# toplevel, calcolato al momento, mai una cartella fissata qui), cosi'
# controlla sempre il codice che sta davvero per partire, non quello di
# un altro worktree.
#
# Uso: bash scripts/installa-hook-pre-push.sh
# (va lanciato una volta - gli hook non si committano: chi clona il
# repository, o lavora da un'altra macchina, deve lanciarlo di nuovo sulla
# propria copia).
set -euo pipefail
CARTELLA_BACKEND="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOOKS_DIR="$(git -C "$CARTELLA_BACKEND" rev-parse --git-common-dir)/hooks"
mkdir -p "$HOOKS_DIR"

cat > "$HOOKS_DIR/pre-push" << 'EOF'
#!/usr/bin/env bash
# Installato da nutriai-backend/scripts/installa-hook-pre-push.sh.
# Lancia "npm run verifica" nel backend prima di ogni push, da qualunque
# worktree - se fallisce, il push non parte.
set -e
RADICE="$(git rev-parse --show-toplevel)"
echo "pre-push: controllo del backend prima di spingere (npm run verifica)..."
cd "$RADICE" && npm run verifica
EOF
chmod +x "$HOOKS_DIR/pre-push"

echo "Hook installato in $HOOKS_DIR/pre-push."
echo "Vale per ogni worktree di questo repository (main, notte-generatore, ecc.)."
