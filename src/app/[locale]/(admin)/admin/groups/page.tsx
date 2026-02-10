import { fetchAdminGroups } from "./_queries/fetchGroups";
import GroupsTable from "./_components/GroupsTable";
import { getTranslations } from "next-intl/server";
type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function Page({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin.groups" });
  const groups = await fetchAdminGroups(locale);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t("title")}
        </h1>
        <p className="text-sm text-zinc-500 flex justify-between items-center">
          {t("subtitle")}
          <span className="text-black">
            {" "}
            {t("total")} {groups.length}
          </span>
        </p>
      </div>

      <GroupsTable locale={locale} groups={groups} />
    </div>
  );
}
