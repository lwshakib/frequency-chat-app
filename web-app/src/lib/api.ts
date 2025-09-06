import axios from "axios";

export const getConversations = async (clerkId: string) => {
  const { data } = await axios.get(`/api/conversations?userId=${clerkId}`);
  return data;
};

export const getUsers = async (search?: string) => {
  const { data } = await axios.get(
    `/api/users${search ? `?search=${search}` : ""}`
  );
  return data;
};

export const createGroup = async (groupData: {
  name: string;
  description?: string;
  userIds: string[];
}) => {
  const { data } = await axios.post("/api/conversations", {
    type: "group",
    name: groupData.name,
    description: groupData.description,
    ids: groupData.userIds,
  });
  return data;
};
