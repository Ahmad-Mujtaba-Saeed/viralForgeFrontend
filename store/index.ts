import { combineReducers, configureStore } from '@reduxjs/toolkit'
import storage from 'redux-persist/lib/storage'
import { persistStore, persistReducer } from 'redux-persist'
import authReducer from './authSlice'
import projectReducer from './projectSlice'
import templateReducer from './templateSlice'

const rootReducer = combineReducers({
  auth: authReducer,
  project: projectReducer,
  template: templateReducer,
})

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'project', 'template'],
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

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
