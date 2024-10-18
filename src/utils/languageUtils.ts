export const createLanguageLink = (baseUrl: string, lang: string): string => {
  const url = new URL(baseUrl);
  url.searchParams.set('lang', lang);
  return url.toString();
};

// Usage example:
// const danishLink = createLanguageLink('https://your-domain.com', 'da');