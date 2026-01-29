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
import { base } from './index'

export const eventsRouter = {
	list: base
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

	create: base
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

	update: base
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

	delete: base
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
