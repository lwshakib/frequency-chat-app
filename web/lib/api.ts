const API_BASE_URL =
  process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";

// Generic fetch wrapper with error handling
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}/api${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include", // Include cookies for auth
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API Error: ${response.status}`);
  }

  return response.json();
}

// ============ USERS API ============

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  isOnline?: boolean;
  lastOnlineAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GetUsersResponse {
  statusCode: number;
  data: {
    users: ApiUser[];
  };
  message: string;
}

export async function searchUsers(
  search: string,
  currentUserId?: string
): Promise<ApiUser[]> {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (currentUserId) params.append("userId", currentUserId);

  const response = await fetchApi<GetUsersResponse>(`/users?${params}`);
  return response.data.users;
}

// ============ CONVERSATIONS API ============

export interface ApiConversation {
  id: string;
  name: string | null;
  description: string | null;
  imageUrl: string | null;
  type: "ONE_TO_ONE" | "GROUP";
  users: ApiUser[];
  admins: { id: string; name: string }[];
  lastMessage: { content: string } | null;
  lastMessageId: string | null;
  updatedAt: string;
}

export interface GetConversationsResponse {
  statusCode: number;
  data: {
    conversations: ApiConversation[];
  };
  message: string;
}

export interface CreateConversationResponse {
  statusCode: number;
  data: ApiConversation;
  message: string;
}

export async function getConversations(
  userId: string,
  search?: string
): Promise<ApiConversation[]> {
  const params = new URLSearchParams();
  params.append("userId", userId);
  if (search) params.append("search", search);

  const response = await fetchApi<GetConversationsResponse>(
    `/conversations?${params}`
  );
  return response.data.conversations;
}

export async function createOneToOneConversation(
  userIds: [string, string]
): Promise<ApiConversation> {
  const response = await fetchApi<CreateConversationResponse>(
    "/conversations",
    {
      method: "POST",
      body: JSON.stringify({
        ids: userIds,
        type: "ONE_TO_ONE",
      }),
    }
  );
  return response.data;
}

export async function createGroupConversation(params: {
  name: string;
  description?: string;
  imageUrl?: string;
  memberIds: string[];
  adminId: string;
}): Promise<ApiConversation> {
  const response = await fetchApi<CreateConversationResponse>(
    "/conversations",
    {
      method: "POST",
      body: JSON.stringify({
        ids: params.memberIds,
        type: "GROUP",
        name: params.name,
        description: params.description || null,
        imageUrl: params.imageUrl || null,
        adminId: params.adminId,
      }),
    }
  );
  return response.data;
}

// ============ CLOUDINARY API ============

export interface CloudinarySignatureResponse {
  statusCode: number;
  data: {
    signature: string;
    timestamp: number;
    cloudName: string;
    apiKey: string;
    folder: string;
  };
  message: string;
}

export async function getCloudinarySignature(): Promise<
  CloudinarySignatureResponse["data"]
> {
  const response = await fetchApi<CloudinarySignatureResponse>(
    "/cloudinary-signature"
  );
  return response.data;
}

export async function uploadToCloudinary(file: File): Promise<string> {
  const { signature, timestamp, cloudName, apiKey, folder } =
    await getCloudinarySignature();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("signature", signature);
  formData.append("timestamp", timestamp.toString());
  formData.append("api_key", apiKey);
  formData.append("folder", folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Failed to upload image to Cloudinary");
  }

  const data = await response.json();
  return data.secure_url;
}
