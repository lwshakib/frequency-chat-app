import { z } from "zod";
import { CONVERSATION_TYPE } from "../../generated/prisma/enums";

// Re-export Prisma enum for convenience
export { CONVERSATION_TYPE };

// Type alias for conversation type values
export type ConversationTypeValue = CONVERSATION_TYPE;

export const CreateConversationSchema = z
  .object({
    ids: z.array(z.string().min(1)),
    type: z.nativeEnum(CONVERSATION_TYPE, {
      message: "Type must be either 'ONE_TO_ONE' or 'GROUP'",
    }),
    name: z
      .string()
      .max(100, "Name must be less than 100 characters")
      .optional(),
    description: z
      .string()
      .max(500, "Description must be less than 500 characters")
      .optional(),
    imageUrl: z.string().url().optional(),
    adminId: z.string().optional(),
  })
  .refine(
    (data) => {
      // Name is required for group conversations
      if (
        data.type === CONVERSATION_TYPE.GROUP &&
        (!data.name || data.name.trim() === "")
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Name is required for group conversations",
      path: ["name"],
    }
  )
  .refine(
    (data) => {
      // One-to-one conversations must have exactly 2 user IDs
      if (data.type === CONVERSATION_TYPE.ONE_TO_ONE && data.ids.length !== 2) {
        return false;
      }
      // Group conversations must have at least 1 user ID
      if (data.type === CONVERSATION_TYPE.GROUP && data.ids.length < 1) {
        return false;
      }
      return true;
    },
    {
      message:
        "One-to-one conversations must have exactly 2 user IDs, group conversations must have at least 1",
      path: ["ids"],
    }
  )
  .refine(
    (data) => {
      // AdminId is required for group conversations
      if (
        data.type === CONVERSATION_TYPE.GROUP &&
        (!data.adminId || data.adminId.trim() === "")
      ) {
        return false;
      }
      return true;
    },
    {
      message: "AdminId is required for group conversations",
      path: ["adminId"],
    }
  );

// Export TypeScript type inferred from the schema
export type CreateConversationInput = z.infer<typeof CreateConversationSchema>;
