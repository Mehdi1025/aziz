import { headers } from "next/headers";
import { buildExamplePassLink } from "@/lib/parse-reservation-link";
import { getRequestOrigin } from "@/lib/request-origin";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function RecupererPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const headersList = await headers();

  const requestHeaders = new Headers();
  const host = headersList.get("host");
  const forwardedHost = headersList.get("x-forwarded-host");
  const forwardedProto = headersList.get("x-forwarded-proto");

  if (host) requestHeaders.set("host", host);
  if (forwardedHost) requestHeaders.set("x-forwarded-host", forwardedHost);
  if (forwardedProto) requestHeaders.set("x-forwarded-proto", forwardedProto);

  const origin = getRequestOrigin(
    new Request("http://local", { headers: requestHeaders }),
  );

  const exampleLink = buildExamplePassLink(origin);
  const errorMessage = params.error ? decodeURIComponent(params.error) : null;

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-linear-to-b from-zinc-50 to-zinc-100 px-6 py-12">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-xl shadow-zinc-200/60">
        <div className="border-b border-zinc-100 bg-zinc-900 px-6 py-8 text-center text-white">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400">
            Récupération
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Obtenir mon pass d&apos;accès
          </h1>
          <p className="mt-3 text-sm text-zinc-400">
            Collez votre lien <span className="text-white">/pass?code=...</span>{" "}
            puis validez.
          </p>
        </div>

        <form action="/api/recuperer" method="POST" className="space-y-5 px-6 py-8">
          <div>
            <label
              htmlFor="reservation-link"
              className="mb-2 block text-sm font-medium text-zinc-700"
            >
              Lien de votre pass
            </label>
            <textarea
              id="reservation-link"
              name="link"
              required
              rows={5}
              placeholder={exampleLink}
              defaultValue=""
              className="w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white"
            />
          </div>

          {errorMessage && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-2xl bg-zinc-900 px-4 py-3.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            Afficher mon pass
          </button>

          <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-xs leading-5 text-zinc-500">
            <p className="font-medium text-zinc-700">Exemple valide :</p>
            <p className="mt-1 break-all font-mono text-[11px] text-zinc-600">
              {exampleLink}
            </p>
          </div>
        </form>

        <div className="border-t border-zinc-100 px-6 pb-8">
          <form action="/api/recuperer" method="POST">
            <input type="hidden" name="link" value={exampleLink} />
            <button
              type="submit"
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Tester avec l&apos;exemple
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
