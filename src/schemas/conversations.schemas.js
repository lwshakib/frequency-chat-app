import { z } from "zod";

export const CreateConversationSchema = z
  .object({
    ids: z.array(z.string().min(1)),
    type: z.enum(["one_to_one", "group"], {
      errorMap: () => ({
        message: "Type must be either 'one_to_one' or 'group'",
      }),
    }),
    name: z
      .string()
      .max(100, "Name must be less than 100 characters")
      .optional(),
  })
  .refine(
    (data) => {
      // Name is required for group conversations
      if (data.type === "group" && (!data.name || data.name.trim() === "")) {
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
      if (data.type === "one_to_one" && data.ids.length !== 2) {
        return false;
      }
      // Group conversations must have at least 1 user ID
      if (data.type === "group" && data.ids.length < 1) {
        return false;
      }
      return true;
    },
    {
      message:
        "One-to-one conversations must have exactly 2 user IDs, group conversations must have at least 1",
      path: ["ids"],
    }
  );
