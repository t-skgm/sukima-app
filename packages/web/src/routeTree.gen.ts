import { Route as rootRoute } from './routes/__root'
import { Route as CFamilyIdImport } from './routes/c/$familyId'
import { Route as CFamilyIdDestinationsImport } from './routes/c/$familyId/destinations'
import { Route as CFamilyIdIndexImport } from './routes/c/$familyId/index'
import { Route as CFamilyIdSettingsImport } from './routes/c/$familyId/settings'
import { Route as IndexImport } from './routes/index'

const IndexRoute = IndexImport.update({
	id: '/',
	path: '/',
	getParentRoute: () => rootRoute,
} as any)

const CFamilyIdRoute = CFamilyIdImport.update({
	id: '/c/$familyId',
	path: '/c/$familyId',
	getParentRoute: () => rootRoute,
} as any)

const CFamilyIdIndexRoute = CFamilyIdIndexImport.update({
	id: '/',
	path: '/',
	getParentRoute: () => CFamilyIdRoute,
} as any)

const CFamilyIdSettingsRoute = CFamilyIdSettingsImport.update({
	id: '/settings',
	path: '/settings',
	getParentRoute: () => CFamilyIdRoute,
} as any)

const CFamilyIdDestinationsRoute = CFamilyIdDestinationsImport.update({
	id: '/destinations',
	path: '/destinations',
	getParentRoute: () => CFamilyIdRoute,
} as any)

export interface FileRoutesByFullPath {
	'/': typeof IndexRoute
	'/c/$familyId': typeof CFamilyIdRoute
	'/c/$familyId/': typeof CFamilyIdIndexRoute
	'/c/$familyId/settings': typeof CFamilyIdSettingsRoute
	'/c/$familyId/destinations': typeof CFamilyIdDestinationsRoute
}

export interface FileRoutesByTo {
	'/': typeof IndexRoute
	'/c/$familyId': typeof CFamilyIdIndexRoute
	'/c/$familyId/settings': typeof CFamilyIdSettingsRoute
	'/c/$familyId/destinations': typeof CFamilyIdDestinationsRoute
}

export interface FileRoutesById {
	__root__: typeof rootRoute
	'/': typeof IndexRoute
	'/c/$familyId': typeof CFamilyIdRoute
	'/c/$familyId/': typeof CFamilyIdIndexRoute
	'/c/$familyId/settings': typeof CFamilyIdSettingsRoute
	'/c/$familyId/destinations': typeof CFamilyIdDestinationsRoute
}

export interface FileRouteTypes {
	fileRoutesByFullPath: FileRoutesByFullPath
	fullPaths:
		| '/'
		| '/c/$familyId'
		| '/c/$familyId/'
		| '/c/$familyId/settings'
		| '/c/$familyId/destinations'
	fileRoutesByTo: FileRoutesByTo
	to: '/' | '/c/$familyId' | '/c/$familyId/settings' | '/c/$familyId/destinations'
	id:
		| '__root__'
		| '/'
		| '/c/$familyId'
		| '/c/$familyId/'
		| '/c/$familyId/settings'
		| '/c/$familyId/destinations'
	fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
	IndexRoute: typeof IndexRoute
	CFamilyIdRoute: typeof CFamilyIdRoute
}

const rootRouteChildren: RootRouteChildren = {
	IndexRoute: IndexRoute,
	CFamilyIdRoute: CFamilyIdRoute,
}

export const routeTree = rootRoute
	._addFileChildren(rootRouteChildren)
	._addFileTypes<FileRouteTypes>()

export interface CFamilyIdRouteChildren {
	CFamilyIdIndexRoute: typeof CFamilyIdIndexRoute
	CFamilyIdSettingsRoute: typeof CFamilyIdSettingsRoute
	CFamilyIdDestinationsRoute: typeof CFamilyIdDestinationsRoute
}

const CFamilyIdRouteChildren: CFamilyIdRouteChildren = {
	CFamilyIdIndexRoute: CFamilyIdIndexRoute,
	CFamilyIdSettingsRoute: CFamilyIdSettingsRoute,
	CFamilyIdDestinationsRoute: CFamilyIdDestinationsRoute,
}

CFamilyIdRoute._addFileChildren(CFamilyIdRouteChildren)
/* prettier-ignore-end */
