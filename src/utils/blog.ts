/**
 * @description Get reading time in minutes
 * @param body
 * @returns
 */
export function getArticleReadingTime(body: string) {
  const wordsPerMinute = 183;
  const numberOfWords = body.split(/\s/g).length;
  const minutes = numberOfWords / wordsPerMinute;
  const readTime = Math.ceil(minutes);
  return readTime;
}
