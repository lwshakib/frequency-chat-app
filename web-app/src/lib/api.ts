import axios from "axios";
import { handleApiError } from "./error-handler";
import { logger } from "./logger";
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

// Configure axios defaults
axios.defaults.timeout = 30000; // 30 seconds

// Add request interceptor for logging
axios.interceptors.request.use(
  (config) => {
    logger.debug("API Request:", config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    logger.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axios.interceptors.response.use(
  (response) => {
    logger.debug("API Response:", response.status, response.config.url);
    return response;
  },
  (error) => {
    // Don't handle errors here - let individual functions handle them
    // This interceptor is just for logging
    logger.error("API Response Error:", error);
    return Promise.reject(error);
  }
);

export const getConversations = async (
  clerkId: string
): Promise<GetConversationsResponse> => {
  try {
    const { data } = await axios.get(`/api/conversations?userId=${clerkId}`);
    return data;
  } catch (error) {
    handleApiError(error, "Failed to load conversations");
    throw error;
  }
};

export const getConversationById = async (
  conversationId: string,
  clerkId: string
): Promise<GetConversationByIdResponse> => {
  try {
    const { data } = await axios.get(
      `/api/conversations/${conversationId}/${clerkId}`
    );
    return data;
  } catch (error) {
    handleApiError(error, "Failed to load conversation");
    throw error;
  }
};

export const getUsers = async (search?: string): Promise<GetUsersResponse> => {
  try {
    const { data } = await axios.get(
      `/api/users${search ? `?search=${encodeURIComponent(search)}` : ""}`
    );
    return data;
  } catch (error) {
    handleApiError(error, "Failed to search users");
    throw error;
  }
};

export const createGroup = async (
  groupData: CreateGroupRequest
): Promise<CreateGroupResponse> => {
  try {
    const { data } = await axios.post("/api/conversations", {
      type: "group",
      name: groupData.name,
      description: groupData.description,
      imageUrl: groupData.imageUrl,
      ids: groupData.userIds,
      adminId: groupData.adminId,
    });
    return data;
  } catch (error) {
    handleApiError(error, "Failed to create group");
    throw error;
  }
};

// Create a one-to-one conversation on demand
export const createOneToOne = async (
  userIds: string[]
): Promise<CreateGroupResponse> => {
  try {
    const { data } = await axios.post("/api/conversations", {
      type: "one_to_one",
      ids: userIds,
    });
    return data;
  } catch (error) {
    handleApiError(error, "Failed to start conversation");
    throw error;
  }
};

export const getMessages = async (
  conversationId: string
): Promise<GetMessagesResponse> => {
  try {
    const { data } = await axios.get(`/api/messages/${conversationId}`);
    return data;
  } catch (error) {
    handleApiError(error, "Failed to load messages");
    throw error;
  }
};

export const updateGroup = async (
  payload: UpdateGroupRequest
): Promise<UpdateGroupResponse> => {
  try {
    const { data } = await axios.put(
      `/api/conversations/${payload.conversationId}`,
      {
        requesterId: payload.requesterId,
        name: payload.name,
        description: payload.description,
        imageUrl: payload.imageUrl,
        addMemberIds: payload.addMemberIds,
        removeMemberIds: payload.removeMemberIds,
        addAdminIds: payload.addAdminIds,
        removeAdminIds: payload.removeAdminIds,
      }
    );
    return data;
  } catch (error) {
    handleApiError(error, "Failed to update group");
    throw error;
  }
};

export const createMessage = async (
  messageData: CreateMessageRequest
): Promise<CreateMessageResponse> => {
  try {
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
  } catch (error) {
    handleApiError(error, "Failed to send message");
    throw error;
  }
};

export const deleteConversation = async (
  conversationId: string,
  requesterId: string
) => {
  try {
    const { data } = await axios.delete(`/api/conversations/${conversationId}`, {
      data: { requesterId },
    });
    return data;
  } catch (error) {
    handleApiError(error, "Failed to delete conversation");
    throw error;
  }
};

export const getCloudinaryAuth = async () => {
  try {
    const { data } = await axios.get(`/api/cloudinary-signature`);
    return data as {
      signature: string;
      cloudName: string;
      timestamp: number;
      folder: string;
      apiKey: string;
    };
  } catch (error) {
    handleApiError(error, "Failed to get upload credentials");
    throw error;
  }
};
