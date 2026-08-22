"use client";

import NextImage from "next/image";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { useLocale } from "@/lib/i18n/context";

type QrKind = "online" | "table";
type QrLanguage = "de" | "en";

const signCopy = {
  en: {
    eyebrow: "Scan · Choose · Enjoy",
    table: "Table",
    online: "Order online",
    description: "Scan the code to browse our selection and place your order.",
  },
  de: {
    eyebrow: "Scannen · Auswählen · Genießen",
    table: "Tisch",
    online: "Online bestellen",
    description: "Scannen Sie den Code, entdecken Sie unser Sortiment und bestellen Sie direkt.",
  },
} as const;

const generatorCopy = {
  en: {
    details: "QR code details",
    detailsDescription: "Make one general code for online pickup, or a separate code for each café table.",
    orderType: "Order type",
    cafeTable: "Café table",
    cafeTableDescription: "Dine-in is selected and staff see the table number.",
    onlineOrdering: "Online ordering",
    onlineDescription: "Pickup is selected for flyers, windows, and social posts.",
    signLanguage: "Sign and ordering language",
    tableNumber: "Table number",
    trackingCampaign: "Tracking campaign",
    campaignHint: "Use a unique name for each placement.",
    destination: "Destination URL or path",
    destinationHint: "For example /shop or a specific product URL.",
    website: "Website address",
    scannedLink: "Scanned link",
    invalidLink: "Invalid website address",
    invalidWebsite: "Invalid website address",
    externalDestination: "Destination must be on the Grainbuds website",
    campaignRequired: "Add a campaign name",
    invalidUrls: "Enter valid URLs",
    enterAddress: "Enter a complete address beginning with https://.",
    copied: "Link copied",
    copyLink: "Copy link",
    download: "Download PNG",
    print: "Print sign",
    previewError: "Enter a valid website address",
  },
  de: {
    details: "QR-Code-Details",
    detailsDescription: "Erstellen Sie einen allgemeinen Code für Online-Abholung oder einen eigenen Code für jeden Café-Tisch.",
    orderType: "Bestellart",
    cafeTable: "Café-Tisch",
    cafeTableDescription: "Vor Ort wird ausgewählt und das Personal sieht die Tischnummer.",
    onlineOrdering: "Online-Bestellung",
    onlineDescription: "Abholung wird für Flyer, Schaufenster und Social Media ausgewählt.",
    signLanguage: "Sprache für Schild und Bestellung",
    tableNumber: "Tischnummer",
    trackingCampaign: "Tracking-Kampagne",
    campaignHint: "Verwenden Sie für jeden Standort einen eindeutigen Namen.",
    destination: "Ziel-URL oder Pfad",
    destinationHint: "Zum Beispiel /shop oder die URL eines bestimmten Produkts.",
    website: "Website-Adresse",
    scannedLink: "Link im QR-Code",
    invalidLink: "Ungültige Website-Adresse",
    invalidWebsite: "Ungültige Website-Adresse",
    externalDestination: "Das Ziel muss auf der Grainbuds-Website liegen",
    campaignRequired: "Geben Sie einen Kampagnennamen ein",
    invalidUrls: "Geben Sie gültige URLs ein",
    enterAddress: "Geben Sie eine vollständige Adresse mit https:// ein.",
    copied: "Link kopiert",
    copyLink: "Link kopieren",
    download: "PNG herunterladen",
    print: "Schild drucken",
    previewError: "Geben Sie eine gültige Website-Adresse ein",
  },
} as const;

const A7_PNG_WIDTH = 874;
const A7_PNG_HEIGHT = 1240;

function loadCanvasImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load image: ${src}`));
    image.src = src;
  });
}

function drawCenteredLines(
  context: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  startY: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);

  lines.forEach((value, index) => {
    context.fillText(value, centerX, startY + index * lineHeight);
  });
}

function drawCenteredSpacedText(
  context: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  spacing: number
) {
  const characters = [...text];
  const width =
    characters.reduce(
      (total, character) => total + context.measureText(character).width,
      0
    ) + spacing * Math.max(0, characters.length - 1);
  let x = centerX - width / 2;

  for (const character of characters) {
    context.fillText(character, x, y);
    x += context.measureText(character).width + spacing;
  }
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

async function setPngPrintDensity(blob: Blob) {
  const source = new Uint8Array(await blob.arrayBuffer());
  const densityChunk = new Uint8Array(21);
  const view = new DataView(densityChunk.buffer);
  view.setUint32(0, 9);
  densityChunk.set([112, 72, 89, 115], 4); // pHYs
  view.setUint32(8, 11811); // 300 DPI in pixels per metre
  view.setUint32(12, 11811);
  densityChunk[16] = 1;
  view.setUint32(17, crc32(densityChunk.subarray(4, 17)));

  // Canvas PNGs normally have no density metadata. Remove it if present so
  // print software always receives one unambiguous 300-DPI A7 definition.
  const parts: Uint8Array[] = [source.slice(0, 8)];
  let offset = 8;
  let inserted = false;
  while (offset + 12 <= source.length) {
    const chunkLength = new DataView(
      source.buffer,
      source.byteOffset + offset,
      4
    ).getUint32(0);
    const end = offset + 12 + chunkLength;
    if (end > source.length) break;
    const type = String.fromCharCode(...source.subarray(offset + 4, offset + 8));
    if (type !== "pHYs") parts.push(source.slice(offset, end));
    if (type === "IHDR" && !inserted) {
      parts.push(densityChunk);
      inserted = true;
    }
    offset = end;
  }

  const output = new Uint8Array(
    parts.reduce((total, part) => total + part.byteLength, 0)
  );
  let outputOffset = 0;
  for (const part of parts) {
    output.set(part, outputOffset);
    outputOffset += part.byteLength;
  }
  return new Blob([output.buffer], { type: "image/png" });
}

function slugifyCampaign(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export default function QrCodeGenerator({
  initialBaseUrl,
  initialLanguage,
}: {
  initialBaseUrl: string;
  initialLanguage: QrLanguage;
}) {
  const interfaceLocale = useLocale();
  const ui = generatorCopy[interfaceLocale];
  const [kind, setKind] = useState<QrKind>("table");
  const [language, setLanguage] = useState<QrLanguage>(initialLanguage);
  const [tableNumber, setTableNumber] = useState(1);
  const [baseUrl, setBaseUrl] = useState(initialBaseUrl);
  const [destination, setDestination] = useState("/shop");
  const [campaign, setCampaign] = useState(`table-1-${initialLanguage}`);
  const [qrCode, setQrCode] = useState<{
    url: string;
    dataUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { orderUrl, destinationError } = useMemo(() => {
    try {
      const siteUrl = new URL(baseUrl.trim());
      if (!["http:", "https:"].includes(siteUrl.protocol)) {
        return { orderUrl: "", destinationError: ui.invalidWebsite };
      }
      const destinationUrl = new URL(destination.trim() || "/shop", siteUrl);
      if (destinationUrl.origin !== siteUrl.origin) {
        return {
          orderUrl: "",
          destinationError: ui.externalDestination,
        };
      }
      const campaignSlug = slugifyCampaign(campaign);
      if (!campaignSlug) {
        return { orderUrl: "", destinationError: ui.campaignRequired };
      }
      const url = new URL(`/q/${campaignSlug}`, siteUrl);
      url.searchParams.set(
        "destination",
        `${destinationUrl.pathname}${destinationUrl.search}${destinationUrl.hash}`
      );
      url.searchParams.set("order", kind);
      url.searchParams.set("lang", language);
      if (kind === "table") {
        url.searchParams.set(
          "table",
          String(Math.max(1, Math.min(999, tableNumber || 1)))
        );
      }
      return { orderUrl: url.toString(), destinationError: "" };
    } catch {
      return { orderUrl: "", destinationError: ui.invalidUrls };
    }
  }, [baseUrl, campaign, destination, kind, language, tableNumber, ui]);

  useEffect(() => {
    let active = true;
    if (!orderUrl) return;
    QRCode.toDataURL(orderUrl, {
      width: 1000,
      margin: 3,
      errorCorrectionLevel: "H",
      color: { dark: "#121a25", light: "#ffffff" },
    }).then((result) => {
      if (active) setQrCode({ url: orderUrl, dataUrl: result });
    });
    return () => {
      active = false;
    };
  }, [orderUrl]);

  const qrDataUrl = qrCode?.url === orderUrl ? qrCode.dataUrl : "";

  const copy = signCopy[language];
  const label =
    kind === "table" ? `${copy.table} ${tableNumber}` : copy.online;
  const fileName =
    kind === "table"
      ? `grainbuds-table-${tableNumber}-a7.png`
      : "grainbuds-online-ordering-a7.png";

  async function copyLink() {
    if (!orderUrl) return;
    await navigator.clipboard.writeText(orderUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function downloadLabel() {
    if (!qrDataUrl || downloading) return;
    setDownloading(true);

    try {
      await document.fonts.ready;
      const [logo, qrImage] = await Promise.all([
        loadCanvasImage("/brand/grainbuds-logo.png"),
        loadCanvasImage(qrDataUrl),
      ]);
      const canvas = document.createElement("canvas");
      canvas.width = A7_PNG_WIDTH;
      canvas.height = A7_PNG_HEIGHT;
      const context = canvas.getContext("2d");
      if (!context) return;

      const rootStyle = getComputedStyle(document.documentElement);
      const displayFont =
        rootStyle.getPropertyValue("--font-display").trim() || "Georgia";
      const bodyFont =
        rootStyle.getPropertyValue("--font-body").trim() || "sans-serif";
      const centerX = A7_PNG_WIDTH / 2;

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, A7_PNG_WIDTH, A7_PNG_HEIGHT);

      const logoWidth = 390;
      const logoHeight = logoWidth * (logo.naturalHeight / logo.naturalWidth);
      context.drawImage(logo, centerX - logoWidth / 2, 64, logoWidth, logoHeight);

      context.textAlign = "center";
      context.textBaseline = "alphabetic";
      context.fillStyle = "#6d7f2e";
      context.font = `600 24px ${bodyFont}`;
      drawCenteredSpacedText(context, copy.eyebrow.toUpperCase(), centerX, 250, 5);

      context.fillStyle = "#121a25";
      context.font = `600 64px ${displayFont}`;
      context.fillText(label, centerX, 330);

      context.fillStyle = "rgba(18, 26, 37, 0.64)";
      context.font = `400 29px ${bodyFont}`;
      drawCenteredLines(context, copy.description, centerX, 382, 720, 40);

      const qrSize = 620;
      context.imageSmoothingEnabled = false;
      context.drawImage(qrImage, centerX - qrSize / 2, 458, qrSize, qrSize);
      context.imageSmoothingEnabled = true;

      context.fillStyle = "rgba(18, 26, 37, 0.55)";
      context.font = `400 25px ${bodyFont}`;
      context.fillText("grainbuds.de", centerX, 1160);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      if (!blob) return;
      const printReadyBlob = await setPngPrintDensity(blob);
      const url = URL.createObjectURL(printReadyBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="rounded-3xl bg-cream-light p-6 sm:p-8">
        <h2 className="font-display text-2xl text-ink">{ui.details}</h2>
        <p className="mt-1 text-sm leading-relaxed text-ink/55">
          {ui.detailsDescription}
        </p>

        <fieldset className="mt-7">
          <legend className="text-sm font-medium text-ink">{ui.orderType}</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="cursor-pointer rounded-2xl border border-ink/10 p-4 has-[:checked]:border-matcha-deep has-[:checked]:bg-matcha/10 has-[:checked]:ring-2 has-[:checked]:ring-matcha/20">
              <input
                type="radio"
                name="qr_kind"
                value="table"
                checked={kind === "table"}
                onChange={() => {
                  setKind("table");
                  setCampaign(`table-${tableNumber}-${language}`);
                }}
                className="sr-only"
              />
              <span className="block text-sm font-semibold text-ink">
                {ui.cafeTable}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-ink/50">
                {ui.cafeTableDescription}
              </span>
            </label>
            <label className="cursor-pointer rounded-2xl border border-ink/10 p-4 has-[:checked]:border-matcha-deep has-[:checked]:bg-matcha/10 has-[:checked]:ring-2 has-[:checked]:ring-matcha/20">
              <input
                type="radio"
                name="qr_kind"
                value="online"
                checked={kind === "online"}
                onChange={() => {
                  setKind("online");
                  setCampaign(`online-ordering-${language}`);
                }}
                className="sr-only"
              />
              <span className="block text-sm font-semibold text-ink">
                {ui.onlineOrdering}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-ink/50">
                {ui.onlineDescription}
              </span>
            </label>
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="text-sm font-medium text-ink">
            {ui.signLanguage}
          </legend>
          <div className="mt-3 flex w-fit rounded-full bg-cream p-1">
            {(["de", "en"] as const).map((nextLanguage) => (
              <button
                key={nextLanguage}
                type="button"
                onClick={() => {
                  const currentDefault =
                    kind === "table"
                      ? `table-${tableNumber}-${language}`
                      : `online-ordering-${language}`;
                  if (campaign === currentDefault) {
                    setCampaign(
                      kind === "table"
                        ? `table-${tableNumber}-${nextLanguage}`
                        : `online-ordering-${nextLanguage}`
                    );
                  }
                  setLanguage(nextLanguage);
                }}
                aria-pressed={language === nextLanguage}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                  language === nextLanguage
                    ? "bg-ink text-cream"
                    : "text-ink/50 hover:text-ink"
                }`}
              >
                {nextLanguage === "de" ? "Deutsch" : "English"}
              </button>
            ))}
          </div>
        </fieldset>

        {kind === "table" && (
          <div className="mt-6">
            <label htmlFor="table-number" className="text-sm font-medium text-ink">
              {ui.tableNumber}
            </label>
            <input
              id="table-number"
              type="number"
              min={1}
              max={999}
              value={tableNumber}
              onChange={(event) => {
                const next = Math.max(
                  1,
                  Math.min(999, Number(event.target.value) || 1)
                );
                const previousDefault = `table-${tableNumber}-${language}`;
                setTableNumber(next);
                if (campaign === previousDefault) {
                  setCampaign(`table-${next}-${language}`);
                }
              }}
              className="mt-2 w-full rounded-2xl border border-ink/15 bg-cream px-5 py-3.5 text-sm text-ink outline-none focus:border-matcha-deep focus:ring-4 focus:ring-matcha/20"
            />
          </div>
        )}

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="campaign" className="text-sm font-medium text-ink">
              {ui.trackingCampaign}
            </label>
            <input
              id="campaign"
              value={campaign}
              maxLength={80}
              onChange={(event) => setCampaign(event.target.value)}
              placeholder="front-window"
              className="mt-2 w-full rounded-2xl border border-ink/15 bg-cream px-5 py-3.5 text-sm text-ink outline-none focus:border-matcha-deep focus:ring-4 focus:ring-matcha/20"
            />
            <p className="mt-2 text-xs text-ink/45">
              {ui.campaignHint}
            </p>
          </div>
          <div>
            <label htmlFor="destination" className="text-sm font-medium text-ink">
              {ui.destination}
            </label>
            <input
              id="destination"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder="/shop"
              className="mt-2 w-full rounded-2xl border border-ink/15 bg-cream px-5 py-3.5 text-sm text-ink outline-none focus:border-matcha-deep focus:ring-4 focus:ring-matcha/20"
            />
            <p className="mt-2 text-xs text-ink/45">
              {ui.destinationHint}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <label htmlFor="base-url" className="text-sm font-medium text-ink">
            {ui.website}
          </label>
          <input
            id="base-url"
            type="url"
            value={baseUrl}
            onChange={(event) => setBaseUrl(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-ink/15 bg-cream px-5 py-3.5 text-sm text-ink outline-none focus:border-matcha-deep focus:ring-4 focus:ring-matcha/20"
          />
          {!orderUrl && (
            <p className="mt-2 text-xs text-red-700">
              {destinationError || ui.enterAddress}
            </p>
          )}
        </div>

        <div className="mt-6 rounded-2xl bg-cream px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/40">
            {ui.scannedLink}
          </p>
          <p className="mt-1 break-all text-xs text-ink/65">
            {orderUrl || ui.invalidLink}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={copyLink}
            disabled={!orderUrl}
            className="rounded-full border border-ink/15 px-5 py-3 text-sm font-medium text-ink transition-colors hover:bg-cream disabled:opacity-40"
          >
            {copied ? ui.copied : ui.copyLink}
          </button>
          <button
            type="button"
            onClick={downloadLabel}
            disabled={!qrDataUrl || downloading}
            className="rounded-full border border-ink/15 px-5 py-3 text-sm font-medium text-ink transition-colors hover:bg-cream disabled:opacity-40"
          >
            {ui.download}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!qrDataUrl}
            className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-matcha-deep disabled:opacity-40"
          >
            {ui.print}
          </button>
        </div>
      </section>

      <section className="qr-print-root aspect-[74/105] w-full overflow-hidden rounded-3xl bg-white px-6 py-5 text-center shadow-sm">
        <NextImage
          src="/brand/grainbuds-logo.png"
          alt="Grainbuds Café"
          width={1248}
          height={410}
          className="qr-print-logo mx-auto h-auto w-36"
        />
        <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-matcha-deep">
          {copy.eyebrow}
        </p>
        <h2 className="mt-1 font-display text-3xl text-ink">{label}</h2>
        <p className="mx-auto mt-1 max-w-[310px] text-xs leading-snug text-ink/55">
          {copy.description}
        </p>
        <div className="qr-print-code mx-auto mt-3 aspect-square w-full max-w-[235px]">
          {qrDataUrl ? (
            <NextImage
              src={qrDataUrl}
              alt={`QR code for ${label}`}
              width={1000}
              height={1000}
              unoptimized
              className="h-full w-full"
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-2xl bg-cream text-sm text-ink/40">
              {ui.previewError}
            </div>
          )}
        </div>
        <p className="mt-2 text-[10px] text-ink/45">grainbuds.de</p>
      </section>
    </div>
  );
}
