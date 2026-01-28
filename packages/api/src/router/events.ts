import {
	deleteSuccessOutputSchema,
	eventCreateInputSchema,
	eventDeleteInputSchema,
	eventOutputSchema,
	eventUpdateInputSchema,
} from '@sukima/shared'
import { z } from 'zod'
import * as eventsUsecase from '../usecases/events'
import { pub } from './index'

export const eventsRouter = {
	list: pub
		.input(z.object({}))
		.output(z.object({ events: z.array(eventOutputSchema) }))
		.handler(async ({ context }) => {
			const familyId = context.familyId
			if (!familyId) throw new Error('Family ID is required')

			const deps = { db: context.env.DB }
			const events = await eventsUsecase.listEvents(deps)(familyId)
			return { events }
		}),

	create: pub
		.input(eventCreateInputSchema)
		.output(eventOutputSchema)
		.handler(async ({ input, context }) => {
			const familyId = context.familyId
			if (!familyId) throw new Error('Family ID is required')

			const deps = { db: context.env.DB }
			return eventsUsecase.createEvent(deps)(familyId, input)
		}),

	update: pub
		.input(eventUpdateInputSchema)
		.output(eventOutputSchema)
		.handler(async ({ input, context }) => {
			const familyId = context.familyId
			if (!familyId) throw new Error('Family ID is required')

			const deps = { db: context.env.DB }
			return eventsUsecase.updateEvent(deps)(familyId, input)
		}),

	delete: pub
		.input(eventDeleteInputSchema)
		.output(deleteSuccessOutputSchema)
		.handler(async ({ input, context }) => {
			const familyId = context.familyId
			if (!familyId) throw new Error('Family ID is required')

			const deps = { db: context.env.DB }
			await eventsUsecase.deleteEvent(deps)(familyId, input.id)
			return { success: true as const }
		}),
}
