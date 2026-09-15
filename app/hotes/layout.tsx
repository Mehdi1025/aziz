import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "KeyNest — Espace Hôte",
  description:
    "Gérez vos clés, déposez-les en casier et générez des passes pour vos voyageurs Airbnb.",
};

export default function HotesLayout({ children }: { children: ReactNode }) {
  return children;
}
