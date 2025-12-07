import { getCollection } from "astro:content";
import rss from "@astrojs/rss";

export const get = async () => {
  const posts = (
    await getCollection("blog", ({ data }) => {
      return !data.draft && data.publishDate < new Date();
    })
  ).sort((a, b) => {
    return b.data.publishDate.valueOf() - a.data.publishDate.valueOf();
  });

  return rss({
    title: "Camilla",
    description: "Camilla - Personal Blog",
    site: import.meta.env.SITE,
    items: posts.map((post) => ({
      link: post.id,
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishDate,
    })),
  });
};
