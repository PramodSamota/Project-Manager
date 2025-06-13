import { z } from "zod";

const notesSchema = z.object({
  content: z.string().trim().nonempty({ message: "Note Content is required" }),
});

const validateNoteData = (data) => {
  return notesSchema.safeParse(data);
};

export { validateNoteData };
