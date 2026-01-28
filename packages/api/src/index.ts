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
app.get('/health', (c) => c.json({ status: 'ok' }))

// oRPC handler
const handler = new RPCHandler({ router })

// Public routes (no family context required)
app.post('/rpc/*', async (c) => {
	const context: Context = {
		env: c.env,
		gateways: { db: c.env.DB as Database },
	}

	const result = await handler.handle(c.req.raw, {
		prefix: '/rpc',
		context,
	})

	if (result.matched) {
		return result.response
	}
	return c.json({ error: 'Not found' }, 404)
})

// Family-scoped routes
app.post('/c/:familyId/rpc/*', async (c) => {
	const familyId = c.req.param('familyId')

	const context: Context = {
		env: c.env,
		familyId,
		gateways: { db: c.env.DB as Database },
	}

	const result = await handler.handle(c.req.raw, {
		prefix: `/c/${familyId}/rpc`,
		context,
	})

	if (result.matched) {
		return result.response
	}
	return c.json({ error: 'Not found' }, 404)
})

export default app
