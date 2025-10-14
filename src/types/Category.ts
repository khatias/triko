export type Category = {
  id: string;
  parent_id: string | null;
  name_en: string;
  name_ka: string;
  slug_en: string;
  slug_ka: string;
  position: number;
  image_url?: string | null;
};
export type NavChild = { id: string | number; name: string; href: string };
export type NavItem = {
  id: string | number;
  name: string;
  href: string;
  children?: NavChild[];
};
