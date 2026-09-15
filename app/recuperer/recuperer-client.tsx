"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  buildExamplePassLink,
  buildExamplePassLinkFull,
  parseReservationLink,
} from "@/lib/parse-reservation-link";

const EXAMPLE_RELATIVE = buildExamplePassLink();
const PLACEHOLDER =
  "https://aziz-beta-six.vercel.app/pass?code=HMNCWQN8DM&in=15 sept. 2026&out=20 sept. 2026&name=Emma&guests=2&keyId=key_marais&box=3&site=paris-opera";

export function RecupererClient() {
  const router = useRouter();
  const [link, setLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    const parsed = parseReservationLink(link);

    if (!parsed.ok) {
      setError(parsed.error);
      setIsPending(false);
      return;
    }

    router.push(parsed.passUrl);
  }

  function handleTryExample() {
    const full =
      typeof window !== "undefined"
        ? buildExamplePassLinkFull(window.location.origin)
        : EXAMPLE_RELATIVE;
    setLink(full);
    setError(null);
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-linear-to-b from-zinc-50 to-zinc-100 px-4 py-12 sm:px-6">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-xl shadow-zinc-200/60">
        <div className="border-b border-zinc-100 bg-zinc-900 px-6 py-8 text-center text-white">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400">
            Récupération
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Obtenir mon pass d&apos;accès
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Collez le lien reçu sur{" "}
            <span className="font-medium text-white">Airbnb</span> ou par message.
            Les espaces dans les dates sont gérés automatiquement.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-8">
          <div>
            <label
              htmlFor="reservation-link"
              className="mb-2 block text-sm font-medium text-zinc-700"
            >
              Lien de votre pass
            </label>
            <input
              id="reservation-link"
              type="text"
              value={link}
              onChange={(e) => {
                setLink(e.target.value);
                if (error) setError(null);
              }}
              placeholder={PLACEHOLDER}
              autoComplete="off"
              spellCheck={false}
              className={`w-full rounded-2xl border bg-zinc-50 px-4 py-3.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:bg-white ${
                error
                  ? "border-red-300 focus:border-red-400"
                  : "border-zinc-200 focus:border-zinc-400"
              }`}
            />
            {error && (
              <p className="mt-2 text-sm leading-6 text-red-600" role="alert">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending || !link.trim()}
            className="w-full rounded-2xl bg-zinc-900 px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Redirection…" : "Afficher mon pass"}
          </button>

          <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-xs leading-5 text-zinc-500">
            <p className="font-medium text-zinc-700">Exemple valide :</p>
            <p className="mt-1 break-all font-mono text-[11px] text-zinc-600">
              {PLACEHOLDER}
            </p>
          </div>
        </form>

        <div className="border-t border-zinc-100 px-6 pb-8">
          <button
            type="button"
            onClick={handleTryExample}
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Coller l&apos;exemple
          </button>
        </div>
      </div>
    </div>
  );
}
