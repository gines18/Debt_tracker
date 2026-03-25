import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/landing"],
        disallow: ["/dashboard", "/login", "/register", "/api/"],
      },
    ],
    sitemap: "https://debtremover.co.uk/sitemap.xml",
  };
}