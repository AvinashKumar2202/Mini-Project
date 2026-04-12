import { apiSlice } from './apiSlice';

const CHAT_URL = '/api/chat';

export const chatApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    sendChatMessage: builder.mutation({
      query: (data) => ({
        url: CHAT_URL,
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const { useSendChatMessageMutation } = chatApiSlice;
