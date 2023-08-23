export interface Trend {
  id?: string | null;
  searchTerms?: (string | undefined)[];
  newsCards?: NewsCard[];
  tags?: (string | undefined)[];
}

export interface NewsCard {
  title: string | null | undefined;
  siteName: string | null | undefined;
  thumbnail: string | null | undefined;
  url: string | null | undefined;
  description?: string;
  author?: string;
}
