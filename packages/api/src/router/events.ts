import { ORPCError } from '@orpc/server'
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
			if (!familyId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'Family ID is required',
				})
			}

			const events = await eventsUsecase.listEvents(context.gateways)(familyId)
			return { events }
		}),

	create: pub
		.input(eventCreateInputSchema)
		.output(eventOutputSchema)
		.handler(async ({ input, context }) => {
			const familyId = context.familyId
			if (!familyId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'Family ID is required',
				})
			}

			return eventsUsecase.createEvent(context.gateways)(familyId, input)
		}),

	update: pub
		.input(eventUpdateInputSchema)
		.output(eventOutputSchema)
		.handler(async ({ input, context }) => {
			const familyId = context.familyId
			if (!familyId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'Family ID is required',
				})
			}

			return eventsUsecase.updateEvent(context.gateways)(familyId, input)
		}),

	delete: pub
		.input(eventDeleteInputSchema)
		.output(deleteSuccessOutputSchema)
		.handler(async ({ input, context }) => {
			const familyId = context.familyId
			if (!familyId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'Family ID is required',
				})
			}

			await eventsUsecase.deleteEvent(context.gateways)(familyId, input.id)
			return { success: true as const }
		}),
}
