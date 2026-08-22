import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n/server";
import { cafeInfo } from "@/lib/cafe-info";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy and storage information for the Grainbuds website.",
  alternates: { canonical: "/privacy" },
};

const sections = {
  en: {
    eyebrow: "Privacy",
    title: "Privacy policy",
    updated: "Last updated: 22 August 2026",
    intro:
      "This notice explains how personal data and browser storage are used when you visit grainbuds.de, place an order, or use the staff area.",
    controllerTitle: "1. Controller",
    controller:
      "The controller responsible for this website is Grainbuds. You can contact us using the postal address or telephone number below.",
    dataTitle: "2. Website access and hosting",
    data:
      "The website is hosted by Vercel. When it is accessed, technically required connection and log data may be processed, including IP address, time, requested page, browser information, and error data. This processing is necessary to deliver and secure the website and is based on our legitimate interest in reliable operation (Article 6(1)(f) GDPR). Log retention is determined by operational and security requirements and the hosting provider's applicable terms.",
    ordersTitle: "3. Orders and customer service",
    orders:
      "When you place or edit an order, we process your name, email address, optional telephone number, selected fulfilment method, pickup details, notes, ordered products, prices, status, and payment record. This is necessary to prepare and fulfil your order (Article 6(1)(b) GDPR). Order data is stored in Supabase and is available only to authorised staff. Your private order URL contains an unguessable identifier and must not be shared. Data is retained only as long as needed for fulfilment and applicable commercial, tax, or legal retention duties.",
    emailTitle: "4. Transactional and marketing email",
    email:
      "Order confirmations, cancellation notices, and staff notifications for new or customer-edited orders are delivered through Resend. The email address and order details required for each message are transmitted for this purpose (Article 6(1)(b) GDPR). Marketing email is sent only after explicit opt-in (Article 6(1)(a) GDPR); consent can be withdrawn at any time. Withdrawing marketing consent does not affect operational messages required for an active order.",
    storageTitle: "5. Cookies and local storage",
    storageIntro:
      "We currently use no analytics, advertising, profiling, or social-media tracking. The following first-party storage is technically necessary for requested website functions:",
    storageItems: [
      "grainbuds-cookie-consent — remembers this notice choice for up to one year.",
      "grainbuds-lang — remembers the selected language for up to one year.",
      "grainbuds-cart-v1 (local storage) — keeps the shopping cart until it is cleared or browser data is deleted.",
      "Supabase authentication cookies — used only when authorised staff sign in; duration depends on the staff session.",
      "grainbuds-view — remembers a staff preview mode for up to one day.",
    ],
    storageEnd:
      "Necessary device storage is used to provide the service requested by the user under section 25(2) TDDDG. If optional analytics or advertising tools are introduced later, they must remain disabled until valid consent is obtained.",
    processorsTitle: "6. Service providers and international transfers",
    processors:
      "We use Vercel for hosting, Supabase for database/authentication services, and Resend for email delivery. These providers process data on our behalf. Depending on provider infrastructure, data may be processed outside the European Economic Area. Where required, transfers must be covered by an applicable GDPR transfer mechanism and the provider's data-processing terms.",
    rightsTitle: "7. Your rights",
    rights:
      "Subject to the legal requirements, you may request access, rectification, erasure, restriction, and data portability, and you may object to processing based on legitimate interests. Consent may be withdrawn at any time for the future. You may also complain to a data-protection supervisory authority; for a private business in Bavaria, this is generally the Bavarian State Office for Data Protection Supervision (BayLDA). We may need information to verify your identity before fulfilling a request.",
    changesTitle: "8. Changes",
    changes:
      "We update this notice when the website, providers, or processing activities change. The current version is always published on this page.",
  },
  de: {
    eyebrow: "Datenschutz",
    title: "Datenschutzerklärung",
    updated: "Stand: 22. August 2026",
    intro:
      "Diese Erklärung informiert darüber, wie personenbezogene Daten und Browser-Speicher beim Besuch von grainbuds.de, bei Bestellungen und im Mitarbeiterbereich verwendet werden.",
    controllerTitle: "1. Verantwortlicher",
    controller:
      "Verantwortlich für diese Website ist Grainbuds. Sie erreichen uns unter der unten genannten Postanschrift und Telefonnummer.",
    dataTitle: "2. Website-Aufruf und Hosting",
    data:
      "Die Website wird bei Vercel gehostet. Beim Aufruf können technisch erforderliche Verbindungs- und Protokolldaten verarbeitet werden, darunter IP-Adresse, Zeitpunkt, aufgerufene Seite, Browserinformationen und Fehlerdaten. Die Verarbeitung dient der Auslieferung und Sicherheit der Website und beruht auf unserem berechtigten Interesse an einem zuverlässigen Betrieb (Art. 6 Abs. 1 lit. f DSGVO). Die Speicherdauer der Protokolle richtet sich nach betrieblichen und sicherheitsbezogenen Erfordernissen sowie den geltenden Bedingungen des Hosting-Anbieters.",
    ordersTitle: "3. Bestellungen und Kundenservice",
    orders:
      "Bei einer Bestellung oder Änderung verarbeiten wir Name, E-Mail-Adresse, optionale Telefonnummer, gewählte Bestellart, Abholdaten, Hinweise, bestellte Produkte, Preise, Status und Zahlungsnachweis. Dies ist zur Vorbereitung und Erfüllung der Bestellung erforderlich (Art. 6 Abs. 1 lit. b DSGVO). Bestelldaten werden in Supabase gespeichert und sind nur für berechtigte Mitarbeiter zugänglich. Die private Bestell-URL enthält eine nicht erratbare Kennung und darf nicht weitergegeben werden. Daten werden nur so lange gespeichert, wie es für die Abwicklung und gesetzliche handels-, steuer- oder sonstige Aufbewahrungspflichten erforderlich ist.",
    emailTitle: "4. Bestell- und Marketing-E-Mails",
    email:
      "Bestellbestätigungen, Stornierungsmitteilungen und Mitarbeiterhinweise zu neuen oder vom Kunden geänderten Bestellungen werden über Resend zugestellt. Dafür werden die jeweils benötigte E-Mail-Adresse und Bestelldaten übermittelt (Art. 6 Abs. 1 lit. b DSGVO). Marketing-E-Mails versenden wir nur nach ausdrücklicher Einwilligung (Art. 6 Abs. 1 lit. a DSGVO); diese kann jederzeit für die Zukunft widerrufen werden. Der Widerruf betrifft nicht notwendige Nachrichten zu einer laufenden Bestellung.",
    storageTitle: "5. Cookies und lokaler Speicher",
    storageIntro:
      "Wir setzen derzeit keine Analyse-, Werbe-, Profiling- oder Social-Media-Tracker ein. Folgende eigene Speicherungen sind für gewünschte Website-Funktionen technisch erforderlich:",
    storageItems: [
      "grainbuds-cookie-consent — speichert die Auswahl zu diesem Hinweis für bis zu ein Jahr.",
      "grainbuds-lang — speichert die gewählte Sprache für bis zu ein Jahr.",
      "grainbuds-cart-v1 (Local Storage) — erhält den Warenkorb, bis er geleert oder die Browserdaten gelöscht werden.",
      "Supabase-Authentifizierungs-Cookies — nur für angemeldete berechtigte Mitarbeiter; Dauer entsprechend der Sitzung.",
      "grainbuds-view — speichert den Vorschaumodus für Mitarbeiter für bis zu einen Tag.",
    ],
    storageEnd:
      "Technisch notwendige Speicherung auf dem Endgerät erfolgt zur Bereitstellung des ausdrücklich gewünschten Dienstes nach § 25 Abs. 2 TDDDG. Werden später optionale Analyse- oder Werbedienste ergänzt, müssen diese bis zu einer wirksamen Einwilligung deaktiviert bleiben.",
    processorsTitle: "6. Dienstleister und Drittlandübermittlungen",
    processors:
      "Wir nutzen Vercel für Hosting, Supabase für Datenbank- und Authentifizierungsdienste und Resend für den E-Mail-Versand. Diese Anbieter verarbeiten Daten in unserem Auftrag. Abhängig von der Infrastruktur können Daten außerhalb des Europäischen Wirtschaftsraums verarbeitet werden. Soweit erforderlich, müssen Übermittlungen durch einen anwendbaren DSGVO-Übermittlungsmechanismus und die Auftragsverarbeitungsbedingungen des Anbieters abgesichert sein.",
    rightsTitle: "7. Ihre Rechte",
    rights:
      "Unter den gesetzlichen Voraussetzungen bestehen Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung und Datenübertragbarkeit sowie ein Widerspruchsrecht bei Verarbeitungen auf Grundlage berechtigter Interessen. Einwilligungen können jederzeit für die Zukunft widerrufen werden. Außerdem besteht ein Beschwerderecht bei einer Datenschutzaufsichtsbehörde; für ein privates Unternehmen in Bayern ist regelmäßig das Bayerische Landesamt für Datenschutzaufsicht (BayLDA) zuständig. Vor Bearbeitung einer Anfrage können Angaben zur Identitätsprüfung erforderlich sein.",
    changesTitle: "8. Änderungen",
    changes:
      "Wir aktualisieren diese Erklärung, wenn sich Website, Anbieter oder Verarbeitungsvorgänge ändern. Die aktuelle Fassung wird stets auf dieser Seite veröffentlicht.",
  },
} as const;

export default async function PrivacyPage() {
  const locale = await getLocale();
  const copy = sections[locale];

  return (
    <div className="px-5 pb-28 pt-36 sm:px-8">
      <article className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-matcha-deep">
          {copy.eyebrow}
        </p>
        <h1 className="mt-3 font-display text-5xl text-ink">{copy.title}</h1>
        <p className="mt-4 text-sm text-ink/45">{copy.updated}</p>
        <p className="mt-7 text-base leading-relaxed text-ink/65">{copy.intro}</p>

        <div className="mt-12 space-y-10">
          <PolicySection title={copy.controllerTitle}>
            <p>{copy.controller}</p>
            <address className="mt-4 not-italic">
              <strong>{cafeInfo.name}</strong>
              <br />
              {cafeInfo.address.street}
              <br />
              {cafeInfo.address.zip} {cafeInfo.address.city}
              <br />
              <a href={cafeInfo.phoneHref} className="underline underline-offset-4">
                {cafeInfo.phone}
              </a>
            </address>
          </PolicySection>
          <PolicySection title={copy.dataTitle}>{copy.data}</PolicySection>
          <PolicySection title={copy.ordersTitle}>{copy.orders}</PolicySection>
          <PolicySection title={copy.emailTitle}>{copy.email}</PolicySection>
          <PolicySection title={copy.storageTitle}>
            <p>{copy.storageIntro}</p>
            <ul className="mt-4 list-disc space-y-2 pl-5">
              {copy.storageItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-4">{copy.storageEnd}</p>
          </PolicySection>
          <PolicySection title={copy.processorsTitle}>{copy.processors}</PolicySection>
          <PolicySection title={copy.rightsTitle}>
            <p>{copy.rights}</p>
            <a
              href="https://www.lda.bayern.de/de/kontakt.html"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block font-medium text-matcha-deep underline underline-offset-4"
            >
              BayLDA ↗
            </a>
          </PolicySection>
          <PolicySection title={copy.changesTitle}>{copy.changes}</PolicySection>
        </div>
      </article>
    </div>
  );
}

function PolicySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-2xl text-ink">{title}</h2>
      <div className="mt-3 text-sm leading-7 text-ink/65">{children}</div>
    </section>
  );
}
