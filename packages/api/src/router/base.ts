import { os } from '@orpc/server'
import type { Context } from '../context'

// Base procedure with context
export const pub = os.$context<Context>()
