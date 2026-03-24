export default function robots() {
    return {
      rules: {
        userAgent: "*",
        allow: ["/", "/landing"],
        disallow: ["/dashboard", "/login"],
      },
      sitemap: "https://debtremover.co.uk/sitemap.xml",
    };
  }