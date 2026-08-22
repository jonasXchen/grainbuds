import QrCodeGenerator from "@/components/admin/QrCodeGenerator";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

type CampaignStat = {
  campaign: string;
  scans: number;
  orders: number;
  lastScan: string | null;
};

export default async function AdminQrCodesPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://grainbuds.de";
  const locale = await getLocale();
  const copy = locale === "de"
    ? {
        title: "QR-Codes",
        description: "Erstellen Sie druckfertige Bestellschilder für Café-Tische, Flyer oder das Schaufenster. Jeder Tisch-Code überträgt seine Nummer automatisch in die Bestellübersicht.",
        analytics: "Scan-Analysen",
        analyticsDescription: "Datenschutzfreundliche Zahlen pro Kampagne. Stornierte Bestellungen werden nicht berücksichtigt.",
        scans: "Scans",
        ordered: "Bestellt",
        campaign: "Kampagne",
        scanned: "Gescannt",
        conversion: "Conversion",
        lastScan: "Letzter Scan",
        empty: "Noch keine erfassten Scans. Erstellen und scannen Sie oben einen Code, um zu beginnen.",
      }
    : {
        title: "QR codes",
        description: "Create ready-to-print ordering signs for café tables, flyers, or your front window. Each table code carries its number into the staff order queue automatically.",
        analytics: "Scan analytics",
        analyticsDescription: "Privacy-friendly counts by campaign. Cancelled orders are excluded.",
        scans: "Scans",
        ordered: "Ordered",
        campaign: "Campaign",
        scanned: "Scanned",
        conversion: "Conversion",
        lastScan: "Last scan",
        empty: "No tracked scans yet. Generate a code above and scan it to start.",
      };
  const supabase = await createClient();
  const { data } = await supabase.rpc("grainbuds_qr_campaign_stats");
  const stats: CampaignStat[] = (data ?? []).map(
    (row: {
      campaign: string;
      scans: number | string;
      orders: number | string;
      last_scan: string | null;
    }) => ({
      campaign: row.campaign,
      scans: Number(row.scans) || 0,
      orders: Number(row.orders) || 0,
      lastScan: row.last_scan,
    })
  );
  const totalScans = stats.reduce((total, item) => total + item.scans, 0);
  const totalOrders = stats.reduce((total, item) => total + item.orders, 0);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-4xl text-ink">{copy.title}</h1>
      <p className="mt-2 max-w-2xl text-ink/60">
        {copy.description}
      </p>
      <QrCodeGenerator
        key={locale}
        initialBaseUrl={baseUrl}
        initialLanguage={locale}
      />

      <section className="mt-10 rounded-3xl bg-cream-light p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-ink">{copy.analytics}</h2>
            <p className="mt-1 text-sm text-ink/55">
              {copy.analyticsDescription}
            </p>
          </div>
          <div className="flex gap-5 text-right">
            <div>
              <p className="text-xs uppercase tracking-wider text-ink/40">{copy.scans}</p>
              <p className="font-display text-2xl text-ink">{totalScans}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-ink/40">{copy.ordered}</p>
              <p className="font-display text-2xl text-ink">{totalOrders}</p>
            </div>
          </div>
        </div>

        {stats.length ? (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-ink/10 text-xs uppercase tracking-wider text-ink/40">
                <tr>
                  <th className="pb-3 font-medium">{copy.campaign}</th>
                  <th className="pb-3 text-right font-medium">{copy.scanned}</th>
                  <th className="pb-3 text-right font-medium">{copy.ordered}</th>
                  <th className="pb-3 text-right font-medium">{copy.conversion}</th>
                  <th className="pb-3 text-right font-medium">{copy.lastScan}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/8">
                {stats.map((stat) => (
                  <tr key={stat.campaign}>
                    <td className="py-4 font-medium text-ink">{stat.campaign}</td>
                    <td className="py-4 text-right tabular-nums text-ink/70">
                      {stat.scans}
                    </td>
                    <td className="py-4 text-right tabular-nums text-ink/70">
                      {stat.orders}
                    </td>
                    <td className="py-4 text-right tabular-nums text-matcha-deep">
                      {stat.scans
                        ? `${Math.round((stat.orders / stat.scans) * 100)}%`
                        : "—"}
                    </td>
                    <td className="py-4 text-right text-xs text-ink/50">
                      {stat.lastScan
                        ? new Date(stat.lastScan).toLocaleString(
                            locale === "de" ? "de-DE" : "en-GB"
                          )
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-6 rounded-2xl bg-cream px-5 py-4 text-sm text-ink/50">
            {copy.empty}
          </p>
        )}
      </section>
    </div>
  );
}
