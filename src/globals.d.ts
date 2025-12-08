declare module "astro:content" {
  export interface RenderedContent {
    html: string;
    metadata?: {
      headings: {
        depth: number;
        text: string;
        slug: string;
      }[];
      imagePaths: Array<string>;
      [key: string]: unknown;
    };
  }
}
