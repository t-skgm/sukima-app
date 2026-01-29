import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import * as eventsUsecase from '../usecases/events'
import {
	createEventInputSchema,
	eventOutputSchema,
	updateEventInputSchema,
} from '../usecases/events'
import { base } from './index'

// routerのinput用にbody部分のみ抽出
const createEventBodySchema = createEventInputSchema.shape.data
const updateEventBodySchema = updateEventInputSchema.shape.data.extend({
	id: z.number().int().positive(), // bodyにidを含める
})
const deleteEventBodySchema = z.object({
	id: z.number().int().positive(),
})

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

			return {
				events: await eventsUsecase.listEvents(context.gateways)({
					where: { familyId },
				}),
			}
		}),

	create: base
		.input(createEventBodySchema)
		.output(eventOutputSchema)
		.handler(async ({ input, context }) => {
			const familyId = context.familyId
			if (!familyId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'Family ID is required',
				})
			}

			return eventsUsecase.createEvent(context.gateways)({
				where: { familyId },
				data: input,
			})
		}),

	update: base
		.input(updateEventBodySchema)
		.output(eventOutputSchema)
		.handler(async ({ input, context }) => {
			const familyId = context.familyId
			if (!familyId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'Family ID is required',
				})
			}

			const { id, ...data } = input
			return eventsUsecase.updateEvent(context.gateways)({
				where: { familyId, id },
				data,
			})
		}),

	delete: base
		.input(deleteEventBodySchema)
		.output(z.object({ success: z.literal(true) }))
		.handler(async ({ input, context }) => {
			const familyId = context.familyId
			if (!familyId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'Family ID is required',
				})
			}

			await eventsUsecase.deleteEvent(context.gateways)({
				where: { familyId, id: input.id },
			})
			return { success: true as const }
		}),
}
