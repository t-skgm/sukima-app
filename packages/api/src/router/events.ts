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

			const events = await eventsUsecase.listEvents(context.env.DB, familyId)
			return { events }
		}),

	create: pub
		.input(eventCreateInputSchema)
		.output(eventOutputSchema)
		.handler(async ({ input, context }) => {
			const familyId = context.familyId
			if (!familyId) throw new Error('Family ID is required')

			return eventsUsecase.createEvent(context.env.DB, familyId, input)
		}),

	update: pub
		.input(eventUpdateInputSchema)
		.output(eventOutputSchema)
		.handler(async ({ input, context }) => {
			const familyId = context.familyId
			if (!familyId) throw new Error('Family ID is required')

			return eventsUsecase.updateEvent(context.env.DB, familyId, input)
		}),

	delete: pub
		.input(eventDeleteInputSchema)
		.output(deleteSuccessOutputSchema)
		.handler(async ({ input, context }) => {
			const familyId = context.familyId
			if (!familyId) throw new Error('Family ID is required')

			await eventsUsecase.deleteEvent(context.env.DB, familyId, input.id)
			return { success: true as const }
		}),
}
