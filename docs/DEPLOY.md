# デプロイ手順

## 前提条件

- Cloudflareアカウント
- wrangler CLIがインストール済み（`npm i -g wrangler`）
- wranglerでログイン済み（`wrangler login`）

## 1. D1データベースの作成

```bash
cd packages/api

# 本番用D1データベースを作成
wrangler d1 create sukima-db

# 出力されるdatabase_idをwrangler.tomlに設定
# [env.production.d1_databases]のdatabase_idを更新
```

## 2. D1マイグレーション実行

```bash
# 本番環境にマイグレーション適用
wrangler d1 migrations apply sukima-db --env production --remote
```

## 3. Workers（API）のデプロイ

```bash
cd packages/api

# 本番環境にデプロイ
wrangler deploy --env production
```

デプロイ後、APIのURLが表示されます（例: `https://sukima-api.your-subdomain.workers.dev`）

## 4. Pages（フロントエンド）のデプロイ

### 方法A: Cloudflareダッシュボードから

1. Cloudflareダッシュボード → Pages → Create a project
2. GitHubリポジトリを接続
3. ビルド設定:
   - Framework preset: None
   - Build command: `pnpm build`
   - Build output directory: `packages/web/dist`
   - Root directory: `/`
4. 環境変数を設定:
   - `VITE_API_URL`: WorkersのURL（例: `https://sukima-api.your-subdomain.workers.dev`）

### 方法B: wrangler CLIから

```bash
cd packages/web

# ビルド
pnpm build

# デプロイ
wrangler pages deploy dist --project-name=sukima
```

## 5. カスタムドメイン設定（オプション）

### Workers Routes でAPIを同一ドメインに統合

1. Cloudflareダッシュボード → Workers & Pages → sukima-api → Triggers
2. Routes を追加:
   - `sukima.your-domain.com/rpc/*`
   - `sukima.your-domain.com/c/*/rpc/*`

この設定により、フロントエンドとAPIを同一ドメインで運用でき、CORS設定が不要になります。

## 環境変数

### Workers (packages/api/wrangler.toml)

| 変数名 | 説明 | 例 |
|--------|------|-----|
| APP_URL | フロントエンドのURL（CORS許可用） | https://sukima.pages.dev |

### Pages (環境変数)

| 変数名 | 説明 | 例 |
|--------|------|-----|
| VITE_API_URL | APIのURL | https://sukima-api.workers.dev |

※ Workers Routesで同一ドメイン統合する場合、VITE_API_URLは空文字でOK

## CI/CD（自動デプロイ）

GitHub Actionsを使用してmainブランチへのマージ時に自動デプロイします。

### GitHub Secretsの設定

1. Cloudflare API Tokenを作成
   - Cloudflareダッシュボード → My Profile → API Tokens
   - "Create Token" → "Edit Cloudflare Workers" テンプレートを使用
   - 必要な権限:
     - Account: Cloudflare Workers Scripts (Edit)
     - Account: D1 (Edit)
     - Zone: なし（Workers用）

2. CloudflareアカウントIDを確認
   - Cloudflareダッシュボード → Workers & Pages → 右側の「Account ID」をコピー

3. GitHubリポジトリのSecretsに追加
   - Settings → Secrets and variables → Actions → New repository secret
   - `CLOUDFLARE_API_TOKEN`: 作成したAPIトークン
   - `CLOUDFLARE_ACCOUNT_ID`: CloudflareアカウントID

### 自動デプロイのトリガー

以下の条件でAPIが自動デプロイされます:
- mainブランチへのpush
- 対象パス: `packages/api/**`, `packages/shared/**`, `pnpm-lock.yaml`

ワークフローは以下を実行:
1. 依存関係インストール
2. sharedパッケージビルド
3. D1マイグレーション適用
4. Cloudflare Workersへデプロイ

## ローカル開発

```bash
# APIサーバー起動（別ターミナル）
pnpm dev:api

# フロントエンド起動
pnpm dev
```

開発時はviteのプロキシ設定により、`/rpc/*`と`/c/*/rpc/*`がlocalhost:8787に転送されます。
