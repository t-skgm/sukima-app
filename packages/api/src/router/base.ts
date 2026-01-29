import { os, ORPCError } from '@orpc/server'
import type { Context } from '../context'
import { AppError } from '../usecases/errors'

/** AppErrorをORPCErrorに変換するミドルウェア付きプロシージャ */
export const base = os.$context<Context>().use(async ({ next }) => {
	try {
		return await next()
	} catch (error) {
		if (error instanceof AppError) {
			throw new ORPCError(error.code, {
				message: error.message,
			})
		}
		throw error
	}
})
