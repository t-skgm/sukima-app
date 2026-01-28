import { familyRouter } from './family'

// Re-export pub for external use
export { pub } from './base'

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
