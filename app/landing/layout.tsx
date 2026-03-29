import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Budget Tracker — Take Control of Your Money",
  description: "Free budget tracker app. Track expenses, manage debt, and plan your monthly finances. Used by real people to get out of debt.",
  alternates: {
    canonical: "https://debtremover.co.uk/landing",
  },
  keywords: "budget tracker, expense tracker, debt management, monthly budget, personal finance, UK, debt remover",
  openGraph: {
    title: "Budget Tracker — Take Control of Your Money",
    description: "Free budget tracker. Track expenses month by month and get out of debt.",
    url: "https://debtremover.co.uk",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Budget Tracker — Take Control of Your Money",
    description: "Free budget tracker. Track expenses month by month and get out of debt.",
  },
  verification: {
    google: "BUjNwdK69G_gYTohGCHTUL9kZCE2juOmQbOZFsXttfs",
  },
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}