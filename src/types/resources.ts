export type ResourceCategory = "notes" | "pyqs" | "papers";

export type ResourceRow = {
  id: string;
  owner_id: string;
  title: string;
  category: ResourceCategory;
  class_level: string;
  subject: string;
  chapter: string;
  year: number | null;
  marks: number | null;
  file_name: string;
  file_path: string;
  file_size: number | null;
  marking_scheme_name: string | null;
  marking_scheme_path: string | null;
  marking_scheme_size: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type LibraryResource = ResourceRow & {
  classLevel: string;
  fileName: string;
  fileUrl?: string;
  schemeUrl?: string | null;
  createdAt: string;
};
