export default function sitemap() {
    return [
      {
        url: "https://debtremover.co.uk/",
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 1,
      },
      {
        url: "https://debtremover.co.uk/landing",
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.8,
      },
    ];
  }