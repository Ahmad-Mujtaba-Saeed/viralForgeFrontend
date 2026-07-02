import { combineReducers, configureStore } from '@reduxjs/toolkit'
import storage from 'redux-persist/lib/storage'
import { persistStore, persistReducer, createTransform, type PersistConfig } from 'redux-persist'
import authReducer from './authSlice'
import projectReducer from './projectSlice'
import templateReducer from './templateSlice'
import billingReducer from './billingSlice'

const rootReducer = combineReducers({
  auth: authReducer,
  project: projectReducer,
  template: templateReducer,
  billing: billingReducer,
})

type RootReducerState = ReturnType<typeof rootReducer>

/**
 * Transient UI state (errors, loading flags, request status) must NEVER be
 * persisted — otherwise an error shown once "sticks" across reloads. We strip
 * these keys in BOTH directions so even previously-persisted errors are cleaned
 * on rehydrate.
 */
const TRANSIENT_KEYS = [
  'error',
  'configError',
  'fetchProjectsError',
  'isLoading',
  'isCreating',
  'isUploading',
  'isProcessing',
  'isUpdating',
  'isFetching',
  'isFetchingProjects',
  'isInitialCheck',
  'status',
  'configStatus',
]

const stripTransient = (state: any) => {
  if (!state || typeof state !== 'object' || Array.isArray(state)) return state
  const clone: Record<string, any> = { ...state }
  for (const key of TRANSIENT_KEYS) delete clone[key]
  return clone
}

const transientTransform = createTransform(stripTransient, stripTransient, {
  whitelist: ['auth', 'project', 'template'],
})

const persistConfig: PersistConfig<RootReducerState> = {
  key: 'root',
  storage,
  whitelist: ['auth', 'project', 'template'],
  transforms: [transientTransform as any],
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: false,
    }),
})

export const persistor = persistStore(store)

// Derive from the plain root reducer (not store.getState) so slice types stay
// concrete — persist's transforms otherwise widen them to `| undefined`.
export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = typeof store.dispatch
