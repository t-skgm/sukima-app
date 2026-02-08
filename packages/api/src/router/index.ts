import { anniversariesRouter } from './anniversaries'
import { blockedPeriodsRouter } from './blocked-periods'
import { calendarRouter } from './calendar'
import { destinationsRouter } from './destinations'
import { eventsRouter } from './events'
import { externalCalendarsRouter } from './external-calendars'
import { familyRouter } from './family'
import { ideasRouter } from './ideas'
import { settingsRouter } from './settings'

// Re-export base for external use
export { base } from './base'

// Main router
export const router = {
	family: familyRouter,
	events: eventsRouter,
	anniversaries: anniversariesRouter,
	blockedPeriods: blockedPeriodsRouter,
	ideas: ideasRouter,
	destinations: destinationsRouter,
	calendar: calendarRouter,
	settings: settingsRouter,
	externalCalendars: externalCalendarsRouter,
}

export type Router = typeof router
