import { os } from '@orpc/server'
import type { Context } from '../types'

// Base procedure with context
export const pub = os.$context<Context>()
