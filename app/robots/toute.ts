import { NextResponse } from "next/server";

export async function GET() {
  const robots = `User-agent: *
Allow: /
Allow: /landing
Disallow: /dashboard
Disallow: /login
Disallow: /register
Disallow: /api/

Sitemap: https://debtremover.co.uk/sitemap.xml`;

  return new NextResponse(robots, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}