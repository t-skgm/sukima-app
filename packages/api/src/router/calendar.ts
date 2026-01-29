import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import * as calendarUsecase from '../usecases/calendar'
import { calendarOutputSchema } from '../usecases/calendar'
import { base } from './index'

export const calendarRouter = {
	get: base
		.input(z.object({}))
		.output(calendarOutputSchema)
		.handler(async ({ context }) => {
			const familyId = context.familyId
			if (!familyId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'Family ID is required',
				})
			}

			return calendarUsecase.getCalendar(context.gateways)({
				where: { familyId },
			})
		}),
}
