import { eventsRouter } from './events'
import { familyRouter } from './family'

// Re-export base for external use
export { base } from './base'

// Main router
export const router = {
	family: familyRouter,
	events: eventsRouter,
	// TODO: Add other routers
	// calendar: calendarRouter,
	// ideas: ideasRouter,
	// blockedPeriods: blockedPeriodsRouter,
	// destinations: destinationsRouter,
	// settings: settingsRouter,
}

export type Router = typeof router
