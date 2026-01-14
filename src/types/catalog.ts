export type CategoryRow = {
  id: string;
  name_en: string | null;
  name_ka: string | null;
  position: number | null;
  parent_id: string | null;
  status: string | null;
};

export type ColorRow = {
  id: string;
  code: string;
  name_en: string | null;
  name_ka: string | null;
  hex: string | null;
  position: number | null;
};

export type SizeRow = {
  id: string;
  code: string;
  position: number | null;
};
