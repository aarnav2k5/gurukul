import { z } from "zod";

const allowedFileTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

export const MAX_RESOURCE_SIZE = 50 * 1024 * 1024;

export const resourceFileSchema = z
  .custom<File>((value) => value instanceof File, "Choose a file.")
  .refine((file) => file.size > 0, "The selected file is empty.")
  .refine((file) => file.size <= MAX_RESOURCE_SIZE, "Files must be 50 MB or smaller.")
  .refine((file) => allowedFileTypes.includes(file.type) || /\.(pdf|docx?|pptx?)$/i.test(file.name), "Use a PDF, Word, or PowerPoint file.");

// Browser file inputs provide FileList values. Normalize them before Zod
// validates the upload so validation works consistently across browsers.
const fileInputSchema = z.preprocess(
  (value) => {
    if (typeof FileList !== "undefined" && value instanceof FileList) {
      return value.item(0);
    }
    return value;
  },
  resourceFileSchema,
);

export const resourceMetadataSchema = z.object({
  title: z.string().trim().min(1, "Enter a title.").max(200, "Title is too long."),
  classLevel: z.string().min(1, "Choose a class."),
  subject: z.string().min(1, "Choose a subject."),
  chapter: z.string().trim().max(200, "Chapter name is too long."),
  category: z.enum(["notes", "pyqs", "papers"]),
  year: z.string().refine((value) => !value || /^(19|20)\d{2}$/.test(value), "Enter a valid year."),
  marks: z.string().refine((value) => !value || /^\d+$/.test(value), "Marks must be a whole number."),
});

export const uploadResourceSchema = resourceMetadataSchema.extend({
  file: fileInputSchema,
  scheme: fileInputSchema.optional(),
});

export type UploadResourceValues = z.infer<typeof uploadResourceSchema>;
export type UploadResourceInput = z.input<typeof uploadResourceSchema>;
