#!/bin/bash
set -euo pipefail

# リモート環境（Claude Code on the web）でのみ実行
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# pnpm依存関係のインストール
pnpm install

# sharedパッケージのビルド（他パッケージが依存）
pnpm --filter @sukima/shared build

# entire.io CLIのインストールと有効化
curl -fsSL https://entire.io/install.sh | bash
entire enable
