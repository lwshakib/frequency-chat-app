import React from "react";
import { render, screen } from "@testing-library/react";
import Page from "../../app/(main)/page";
import { useChatStore } from "../../context";
import { useSocket } from "../../context/socket-provider";
import { useSidebar } from "../../components/ui/sidebar";

// Mock the context and hooks
jest.mock("../../context", () => ({
  useChatStore: jest.fn(),
}));

jest.mock("../../context/socket-provider", () => ({
  useSocket: jest.fn(),
}));

jest.mock("../../components/ui/sidebar", () => ({
  useSidebar: jest.fn(),
  SidebarTrigger: () => <div data-testid="sidebar-trigger" />,
}));

jest.mock("../../lib/api", () => ({
  getMessages: jest.fn(),
  markMessagesAsRead: jest.fn().mockResolvedValue({}),
  searchMessages: jest.fn(),
  createOneToOneConversation: jest.fn(),
}));

// Mock child components to keep unit tests focused
jest.mock("../../components/chat/MessagesArea", () => () => (
  <div data-testid="messages-area" />
));
jest.mock("../../components/chat/MessageInput", () => () => (
  <div data-testid="message-input" />
));

describe("Main Page Component", () => {
  const mockSetMessages = jest.fn();
  const mockSetIsLoadingMessages = jest.fn();
  const mockToggleSidebar = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useChatStore as unknown as jest.Mock).mockReturnValue({
      selectedConversation: null,
      session: { user: { name: "Test User", email: "test@example.com" } },
      messages: [],
      setMessages: mockSetMessages,
      setIsLoadingMessages: mockSetIsLoadingMessages,
      resetUnread: jest.fn(),
      setSelectedConversation: jest.fn(),
      setActiveCall: jest.fn(),
    });

    (useSocket as unknown as jest.Mock).mockReturnValue({
      sendMessage: jest.fn(),
      emitTypingStart: jest.fn(),
      emitTypingStop: jest.fn(),
      emitCallStart: jest.fn(),
      emitDeleteConversation: jest.fn(),
    });

    (useSidebar as unknown as jest.Mock).mockReturnValue({
      toggleSidebar: mockToggleSidebar,
    });
  });

  it("renders a welcome message when no conversation is selected", () => {
    render(<Page />);

    expect(screen.getByText(/Ready to chat\?/i)).toBeInTheDocument();
  });

  it("renders the chat area when a conversation is selected", () => {
    (useChatStore as unknown as jest.Mock).mockReturnValue({
      selectedConversation: {
        id: "1",
        type: "ONE_TO_ONE",
        users: [{ id: "2", name: "Other User", email: "other@example.com" }],
      },
      session: { user: { name: "Test User", email: "test@example.com" } },
      messages: [],
      setMessages: mockSetMessages,
      setIsLoadingMessages: mockSetIsLoadingMessages,
      resetUnread: jest.fn(),
      setSelectedConversation: jest.fn(),
      setActiveCall: jest.fn(),
    });

    render(<Page />);

    expect(screen.getByTestId("messages-area")).toBeInTheDocument();
  });
});
