export interface InsightAuthor {
  name: string;
  role: string;
  credentials: string;
}

export interface InsightSection {
  heading: string;
  paragraphs: string[];
}

export interface InsightPost {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  category: string;
  image: string;
  imageCaption: string;
  number: string;
  readTime: string;
  publishedDate: string;
  author: InsightAuthor;
  date: string;
  content: string;
  sections: InsightSection[];
  pullQuote: string;
  keyTakeaways: string[];
  statutesReferenced: string[];
}

export const INSIGHTS_DATA: InsightPost[] = [
  {
    id: 1,
    slug: 'example-insight',
    title: 'Example Insight',
    subtitle: 'A brief overview of the example insight.',
    excerpt: 'This is a brief excerpt of the insight.',
    category: 'Legal',
    image: 'https://images.unsplash.com/photo-1589829545856-c10d52485549?auto=format&fit=crop&q=80&w=800',
    imageCaption: 'A illustrative image for the example insight.',
    number: '01',
    readTime: '5 min read',
    publishedDate: 'Oct 28, 2026',
    author: {
      name: 'John Doe',
      role: 'Senior Advocate',
      credentials: 'LL.M., Supreme Court of Pakistan',
    },
    date: '2026-10-28',
    content: 'This is an example insight.',
    sections: [
      {
        heading: 'Introduction',
        paragraphs: ['This is the first paragraph.', 'This is the second paragraph.'],
      },
    ],
    pullQuote: 'This is a pull quote.',
    keyTakeaways: ['Takeaway 1', 'Takeaway 2'],
    statutesReferenced: ['Statute A', 'Statute B'],
  },
];

export const INSIGHT_CATEGORIES = ['All Publications', 'Legal', 'News'];
