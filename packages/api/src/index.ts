import { onError } from '@orpc/server'
import { RPCHandler } from '@orpc/server/fetch'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Context } from './context'
import type { Env } from './env'
import { router } from './router'
import type { Database } from './usecases/types'

const app = new Hono<{ Bindings: Env }>()

// CORS middleware
app.use(
	'*',
	cors({
		origin: (origin, c) => {
			// Allow requests from APP_URL
			const appUrl = c.env.APP_URL
			if (origin === appUrl) {
				return origin
			}
			// Allow localhost in development
			if (origin?.includes('localhost')) {
				return origin
			}
			return null
		},
		allowMethods: ['GET', 'POST', 'OPTIONS'],
		allowHeaders: ['Content-Type'],
	}),
)

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok' }))

// oRPC handler
const handler = new RPCHandler(router, {
	interceptors: [
		onError((error) => {
			console.error(error)
		}),
	],
})

// Public routes (no family context required)
app.post('/api/rpc/*', async (c, next) => {
	const context: Context = {
		env: c.env,
		gateways: { db: c.env.DB as Database },
	}

	const result = await handler.handle(c.req.raw, {
		prefix: '/api/rpc',
		context,
	})

	if (result.matched) {
		return c.newResponse(result.response.body, result.response)
	}

	return await next()
})

// Family-scoped routes
app.post('/api/:familyId/rpc/*', async (c, next) => {
	const familyId = c.req.param('familyId')

	const context: Context = {
		env: c.env,
		familyId,
		gateways: { db: c.env.DB as Database },
	}

	const result = await handler.handle(c.req.raw, {
		prefix: `/api/${familyId}/rpc`,
		context,
	})

	if (result.matched) {
		return c.newResponse(result.response.body, result.response)
	}

	return await next()
})

// API 404: /api/* でマッチしなかったリクエスト
app.all('/api/*', (c) => c.json({ error: 'Not Found' }, 404))

// SPAフォールバック: 静的アセットを返す（本番環境のみ）
app.all('*', async (c) => {
	if (c.env.ASSETS) {
		return c.env.ASSETS.fetch(c.req.raw)
	}
	return c.notFound()
})

export default app
