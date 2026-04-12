import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import { apiSlice } from './slices/apiSlice';

const store = configureStore({
  reducer: {
    auth: authSlice,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
  // Only enable Redux DevTools in development — removes serializable-check overhead in production
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;

