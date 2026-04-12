import { fetchBaseQuery, createApi } from '@reduxjs/toolkit/query/react';

// We use an empty relative path so that HTTP API requests 
// seamlessly go through the Webpack proxy via setupProxy.js.
// This prevents Mixed Content errors when the frontend is served over HTTPS.
const BASE_URL = process.env.REACT_APP_API_URL || '';

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.userInfo?.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const apiSlice = createApi({
  baseQuery,
  tagTypes: ['User', 'Notification', 'Submission', 'Exam', 'Question'],
  // it like a prent to other api
  // it a build in builder
  endpoints: (builder) => ({}),
});
