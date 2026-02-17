import { heroUpdateAction } from "../heroActions";
import { createClient } from "@/utils/supabase/server";
import { Button, Input } from "@/components/UI/primitives";

type Locale = "en" | "ka";

export type HeroRow = {
  key: "home_hero";
  is_active: boolean;

  image_main_path: string | null;
  image_side_path: string | null;

  main_image_label_en: string;
  main_image_label_ka: string;

  main_card_label_en: string;
  main_card_label_ka: string;

  title_en: string;
  title_ka: string;

  subtitle_en: string;
  subtitle_ka: string;

  cta_primary_href: string;
  cta_secondary_href: string;

  info_tag_en: string;
  info_tag_ka: string;

  info_title_en: string;
  info_title_ka: string;

  info_subtitle_en: string;
  info_subtitle_ka: string;

  details_label_en: string;
  details_label_ka: string;
};

type Props = {
  locale: Locale;
  initialHero: HeroRow;
  saved?: boolean;
  v?: string | null;
};

export default async function HeroEditor({ initialHero, saved, v }: Props) {
  const supabase = await createClient();

  const cacheBust = v ? `?v=${encodeURIComponent(v)}` : "";

  const mainPath = initialHero.image_main_path ?? "hero/main.jpg";
  const sidePath = initialHero.image_side_path ?? "hero/side.jpg";

  const mainUrl =
    supabase.storage.from("site").getPublicUrl(mainPath).data.publicUrl +
    cacheBust;

  const sideUrl =
    supabase.storage.from("site").getPublicUrl(sidePath).data.publicUrl +
    cacheBust;

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Hero section
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Homepage hero texts and images.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={initialHero.is_active}
            form="hero-form"
            className="h-4 w-4"
          />
          Active
        </label>
      </div>

      {saved ? (
        <div className="mt-3 rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          Saved
        </div>
      ) : null}

      <form id="hero-form" action={heroUpdateAction} className="mt-6 space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">
                Main image
              </div>
              <div className="text-xs text-slate-500">
                site bucket • {mainPath}
              </div>
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mainUrl}
              alt="Main hero preview"
              className="mt-3 h-44 w-full rounded-xl object-contain ring-1 ring-slate-900/5"
            />

            <input
              name="image_main"
              type="file"
              accept="image/*"
              className="mt-3 block w-full text-sm"
            />
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">
                Side image
              </div>
              <div className="text-xs text-slate-500">
                site bucket • {sidePath}
              </div>
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sideUrl}
              alt="Side hero preview"
              className="mt-3 h-44 w-full rounded-xl object-contain ring-1 ring-slate-900/5"
            />

            <input
              name="image_side"
              type="file"
              accept="image/*"
              className="mt-3 block w-full text-sm"
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4 space-y-4">
            <div className="text-sm font-semibold text-slate-900">English</div>

            <Input
              id="main_image_label_en"
              name="main_image_label_en"
              label="Main image label"
              defaultValue={initialHero.main_image_label_en}
            />
            <Input
              id="main_card_label_en"
              name="main_card_label_en"
              label="Main card label"
              defaultValue={initialHero.main_card_label_en}
            />

            <label className="block">
              <div className="mb-1 text-sm font-medium text-slate-700">
                Title (new line allowed)
              </div>
              <textarea
                name="title_en"
                defaultValue={initialHero.title_en}
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
              />
            </label>

            <label className="block">
              <div className="mb-1 text-sm font-medium text-slate-700">
                Subtitle
              </div>
              <textarea
                name="subtitle_en"
                defaultValue={initialHero.subtitle_en}
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
              />
            </label>

            <Input
              id="info_tag_en"
              name="info_tag_en"
              label="Info tag"
              defaultValue={initialHero.info_tag_en}
            />

            <label className="block">
              <div className="mb-1 text-sm font-medium text-slate-700">
                Info title (new line allowed)
              </div>
              <textarea
                name="info_title_en"
                defaultValue={initialHero.info_title_en}
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
              />
            </label>

            <Input
              id="info_subtitle_en"
              name="info_subtitle_en"
              label="Info subtitle"
              defaultValue={initialHero.info_subtitle_en}
            />

            <Input
              id="details_label_en"
              name="details_label_en"
              label="Details label"
              defaultValue={initialHero.details_label_en}
            />
          </div>

          <div className="rounded-xl border border-slate-200 p-4 space-y-4">
            <div className="text-sm font-semibold text-slate-900">Georgian</div>

            <Input
              id="main_image_label_ka"
              name="main_image_label_ka"
              label="Main image label"
              defaultValue={initialHero.main_image_label_ka}
            />
            <Input
              id="main_card_label_ka"
              name="main_card_label_ka"
              label="Main card label"
              defaultValue={initialHero.main_card_label_ka}
            />

            <label className="block">
              <div className="mb-1 text-sm font-medium text-slate-700">
                Title (new line allowed)
              </div>
              <textarea
                name="title_ka"
                defaultValue={initialHero.title_ka}
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
              />
            </label>

            <label className="block">
              <div className="mb-1 text-sm font-medium text-slate-700">
                Subtitle
              </div>
              <textarea
                name="subtitle_ka"
                defaultValue={initialHero.subtitle_ka}
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
              />
            </label>

            <Input
              id="info_tag_ka"
              name="info_tag_ka"
              label="Info tag"
              defaultValue={initialHero.info_tag_ka}
            />

            <label className="block">
              <div className="mb-1 text-sm font-medium text-slate-700">
                Info title (new line allowed)
              </div>
              <textarea
                name="info_title_ka"
                defaultValue={initialHero.info_title_ka}
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
              />
            </label>

            <Input
              id="info_subtitle_ka"
              name="info_subtitle_ka"
              label="Info subtitle"
              defaultValue={initialHero.info_subtitle_ka}
            />

            <Input
              id="details_label_ka"
              name="details_label_ka"
              label="Details label"
              defaultValue={initialHero.details_label_ka}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 p-4">
          <div className="text-sm font-semibold text-slate-900">Links</div>
          <p className="mt-1 text-xs text-slate-500">
            Use relative paths like /new-arrivals. Locale prefix is added on
            frontend.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Input
              id="cta_primary_href"
              name="cta_primary_href"
              label="Primary CTA href"
              defaultValue={initialHero.cta_primary_href}
            />
            <Input
              id="cta_secondary_href"
              name="cta_secondary_href"
              label="Secondary CTA href"
              defaultValue={initialHero.cta_secondary_href}
            />
          </div>
        </div>

        <div className="flex items-center justify-end">
          <Button type="submit">Save hero</Button>
        </div>
      </form>
    </div>
  );
}
