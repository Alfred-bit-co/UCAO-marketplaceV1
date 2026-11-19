import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/compte-admin", "/compte-personnel", "/dashboard", "/inscription-admin", "/verification"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
