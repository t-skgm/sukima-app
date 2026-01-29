import { createContext, type ReactNode, use, useMemo } from 'react'
import { createFamilyApi } from './api'

type FamilyApi = ReturnType<typeof createFamilyApi>

const FamilyApiContext = createContext<FamilyApi | null>(null)

export function FamilyApiProvider({
	familyId,
	children,
}: {
	familyId: string
	children: ReactNode
}) {
	const api = useMemo(() => createFamilyApi(familyId), [familyId])

	return <FamilyApiContext.Provider value={api}>{children}</FamilyApiContext.Provider>
}

export function useFamilyApi(): FamilyApi {
	const api = use(FamilyApiContext)
	if (!api) {
		throw new Error('useFamilyApi must be used within a FamilyApiProvider')
	}
	return api
}
