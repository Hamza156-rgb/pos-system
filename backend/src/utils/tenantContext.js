import { AsyncLocalStorage } from 'node:async_hooks';

// Carries the current request's tenant across all async DB calls without
// threading it through every function. Sequelize hooks read from here.
const als = new AsyncLocalStorage();

export const runWithTenant = (store, fn) => als.run(store, fn);

// { tenantId, isSuperadmin } or undefined when outside a request (seeds, login lookup).
export const getTenantStore = () => als.getStore();

export default als;
