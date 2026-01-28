import { os } from '@orpc/server'
import type { Context } from '../types'
import { familyRouter } from './family'

// Base procedure with context
export const pub = os.$context<Context>()

// Main router
export const router = {
	family: familyRouter,
	// TODO: Add other routers
	// calendar: calendarRouter,
	// events: eventsRouter,
	// ideas: ideasRouter,
	// blockedPeriods: blockedPeriodsRouter,
	// destinations: destinationsRouter,
	// settings: settingsRouter,
}

export type Router = typeof router
