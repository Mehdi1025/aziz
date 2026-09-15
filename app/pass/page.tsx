import QRCode from "qrcode";
import { PassCaptureClient } from "@/app/pass/pass-capture-client";
import { resolveDistributorSlugWithLegacy } from "@/lib/network";
import { parsePassSearchParams } from "@/lib/parse-pass-search-params";

type SearchParams = {
  code?: string | string[];
  in?: string | string[];
  out?: string | string[];
  box?: string | string[];
  site?: string | string[];
  name?: string | string[];
  guests?: string | string[];
  keyId?: string | string[];
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

function getParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function ErrorView({ message }: { message: string }) {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-linear-to-b from-zinc-50 to-zinc-100 px-6 py-12">
      <div className="w-full max-w-sm rounded-3xl border border-red-100 bg-white p-8 text-center shadow-xl shadow-zinc-200/60">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl text-red-500">
          !
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
          Pass inaccessible
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">{message}</p>
      </div>
    </div>
  );
}

export default async function PassPage({ searchParams }: PageProps) {
  const raw = await searchParams;

  const parsed = parsePassSearchParams({
    code: getParam(raw.code),
    in: getParam(raw.in),
    out: getParam(raw.out),
    box: getParam(raw.box),
    site: getParam(raw.site),
    name: getParam(raw.name),
    guests: getParam(raw.guests),
    keyId: getParam(raw.keyId),
  });

  if (!parsed.ok) {
    return <ErrorView message={parsed.error} />;
  }

  const { data: captureParams, boxNumber } = parsed;
  const { code, name, site } = captureParams;

  let distributorName = site ?? "KeyNest";
  let cityName = "";

  if (site) {
    try {
      const distributor = await resolveDistributorSlugWithLegacy(site);
      distributorName = distributor.name;
      cityName = distributor.cityName;
    } catch {
      distributorName = site.replace(/-/g, " ");
    }
  }

  const qrDataUrl = await QRCode.toDataURL(code, {
    width: 280,
    margin: 2,
    color: {
      dark: "#18181b",
      light: "#ffffff",
    },
  });

  return (
    <>
      <PassCaptureClient params={captureParams} />
      <div className="flex min-h-full flex-1 items-center justify-center bg-linear-to-b from-zinc-50 to-zinc-100 px-6 py-12">
        <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-xl shadow-zinc-200/60">
          <div className="border-b border-zinc-100 bg-zinc-900 px-6 py-8 text-center text-white">
            {name && site && (
              <p className="mb-3 text-sm leading-relaxed text-zinc-300">
                Bonjour <span className="font-semibold text-white">{name}</span>,
                voici votre pass pour le site{" "}
                <span className="font-semibold text-white">{site}</span>
              </p>
            )}
            {cityName && (
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400">
                {cityName}
              </p>
            )}
            <h1 className="mt-2 text-2xl font-semibold tracking-tight capitalize">
              {distributorName}
            </h1>
          </div>

          <div className="flex flex-col items-center px-6 py-8">
            <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt={`QR Code pour le pass ${code}`}
                width={280}
                height={280}
                className="h-auto w-full max-w-[280px]"
              />
            </div>

            <p className="mt-6 text-center text-sm text-zinc-500">
              Présentez ce QR code au distributeur
            </p>

            <div className="mt-6 w-full rounded-2xl bg-zinc-50 px-5 py-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                Casier n°
              </p>
              <p className="mt-1 text-4xl font-bold tabular-nums tracking-tight text-zinc-900">
                {boxNumber}
              </p>
            </div>

            <p className="mt-6 font-mono text-xs text-zinc-400">{code}</p>
          </div>
        </div>
      </div>
    </>
  );
}
