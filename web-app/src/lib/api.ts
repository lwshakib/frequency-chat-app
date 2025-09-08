import axios from "axios";
import type {
  CreateGroupRequest,
  CreateGroupResponse,
  CreateMessageRequest,
  CreateMessageResponse,
  GetConversationByIdResponse,
  GetConversationsResponse,
  GetMessagesResponse,
  GetUsersResponse,
  UpdateGroupRequest,
  UpdateGroupResponse,
} from "../types";

export const getConversations = async (
  clerkId: string
): Promise<GetConversationsResponse> => {
  const { data } = await axios.get(`/api/conversations?userId=${clerkId}`);
  return data;
};

export const getConversationById = async (
  conversationId: string,
  clerkId: string
): Promise<GetConversationByIdResponse> => {
  const { data } = await axios.get(
    `/api/conversations/${conversationId}/${clerkId}`
  );
  return data;
};

export const getUsers = async (search?: string): Promise<GetUsersResponse> => {
  const { data } = await axios.get(
    `/api/users${search ? `?search=${search}` : ""}`
  );
  return data;
};

export const createGroup = async (
  groupData: CreateGroupRequest
): Promise<CreateGroupResponse> => {
  const { data } = await axios.post("/api/conversations", {
    type: "group",
    name: groupData.name,
    description: groupData.description,
    ids: groupData.userIds,
    adminId: groupData.adminId,
  });
  return data;
};

// Create a one-to-one conversation on demand
export const createOneToOne = async (
  userIds: string[]
): Promise<CreateGroupResponse> => {
  const { data } = await axios.post("/api/conversations", {
    type: "one_to_one",
    ids: userIds,
  });
  return data;
};

export const getMessages = async (
  conversationId: string
): Promise<GetMessagesResponse> => {
  const { data } = await axios.get(`/api/messages/${conversationId}`);
  return data;
};

export const updateGroup = async (
  payload: UpdateGroupRequest
): Promise<UpdateGroupResponse> => {
  const { data } = await axios.put(
    `/api/conversations/${payload.conversationId}`,
    {
      requesterId: payload.requesterId,
      name: payload.name,
      description: payload.description,
      addMemberIds: payload.addMemberIds,
      removeMemberIds: payload.removeMemberIds,
      addAdminIds: payload.addAdminIds,
      removeAdminIds: payload.removeAdminIds,
    }
  );
  return data;
};

export const createMessage = async (
  messageData: CreateMessageRequest
): Promise<CreateMessageResponse> => {
  const { data } = await axios.post(
    `/api/messages/${messageData.conversationId}`,
    {
      content: messageData.content,
      type: messageData.type,
      files: messageData.files,
      audio: messageData.audio,
    }
  );
  return data;
};

export const deleteConversation = async (
  conversationId: string,
  requesterId: string
) => {
  const { data } = await axios.delete(`/api/conversations/${conversationId}`, {
    data: { requesterId },
  });
  return data;
};
