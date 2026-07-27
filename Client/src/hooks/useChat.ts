import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { ChatContact, Message } from "../types";

export const useChatContacts = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["chat", "contacts", userId],
    queryFn: async () => {
      const { data } = await api.get<{ contacts: ChatContact[] }>(`/chat/chatList/${userId}`);
      return data.contacts;
    },
    enabled: !!userId,
    refetchInterval: 15_000,
  });
};

export const useMessages = (roomId: string | undefined) => {
  return useQuery({
    queryKey: ["chat", "messages", roomId],
    queryFn: async () => {
      const { data } = await api.get<{ messages: Message[] }>(`/chat/messages/${roomId}`);
      return data.messages;
    },
    enabled: !!roomId,
    refetchInterval: 5_000,
  });
};

export const useCreateRoom = () => {
  return useMutation({
    mutationFn: async ({
      buyerId,
      sellerId,
      productId,
    }: {
      buyerId: string;
      sellerId: string;
      // When set, the backend drops a reference card for this product into
      // the room (deduped against whatever was referenced there last) so
      // both sides land in the conversation already knowing what it's about.
      productId?: string;
    }) => {
      const { data } = await api.post<{ roomId: string }>("/chat/join-room", { buyerId, sellerId, productId });
      return data.roomId;
    },
  });
};

export const useSendMessage = (roomId: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { roomId: string; userId: string; message: unknown; messageType?: string }) => {
      const { data } = await api.post<{ savedMessage: Message }>("/chat/sendMessage", payload);
      return data.savedMessage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", "messages", roomId] });
      queryClient.invalidateQueries({ queryKey: ["chat", "contacts"] });
    },
  });
};

export const useMarkRoomRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { roomId: string; userId: string }) => {
      await api.post("/chat/markRoomRead", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", "contacts"] });
    },
  });
};
