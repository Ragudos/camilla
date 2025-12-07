import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

export const collections = {
  blog: defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/blog" }),
    schema: z.object({
      draft: z.boolean(),
      title: z.string(),
      description: z.string(),
      image: z.object({
        src: z.string(),
        alt: z.string(),
      }),
      publishDate: z.coerce.date(),
      updateDate: z.coerce.date().optional(),
      author: z.string().default("Camilla"),
      category: z.string(),
      tags: z.array(z.string()),
    }),
  }),
};
