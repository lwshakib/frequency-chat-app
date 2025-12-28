export const getInitials = (name: string) => {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }
  return name.charAt(0).toUpperCase();
};

export const getAvatarColor = (id: string) => {
  const colors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
  ];
  const index =
    id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    colors.length;
  return colors[index];
};

export const getDisplayName = (conversation: any, currentUserId?: string) => {
  if (!conversation) return "";
  if (conversation.type === "GROUP") return conversation.name;
  const otherUser = conversation.users?.find(
    (u: any) => u.id !== currentUserId || u.clerkId !== currentUserId
  );
  return otherUser?.name || otherUser?.email || "Unknown";
};

export const getDisplayDescription = (conversation: any) => {
  if (!conversation) return "";
  if (conversation.type === "GROUP")
    return `${conversation.users?.length || 0} members`;
  return "Direct Message";
};

export const formatMessageTime = (date: Date | string | number) => {
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};
