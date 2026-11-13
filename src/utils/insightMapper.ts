import { LegalInsightItem } from '../types/portal';
import { InsightPost } from '../data/insightsData';
import gavelImg from '../assets/images/blog_gavel_copper_1793276830980.jpg';

export function mapInsightItemToPost(item: LegalInsightItem, index: number): InsightPost {
  const authorName =
    typeof item.author === 'object' && item.author !== null
      ? item.author.name
      : String(item.author || 'Mr. Rahim Nawaz Khan Abbasi');
  const authorRole =
    typeof item.author === 'object' && item.author !== null
      ? item.author.role
      : 'Senior Counsel';
  const authorCredentials =
    typeof item.author === 'object' && item.author !== null
      ? item.author.credentials || authorRole
      : authorRole;

  const contentParagraphs = Array.isArray(item.content)
    ? item.content.filter(Boolean)
    : item.content
    ? [String(item.content)]
    : [];

  const sections =
    item.sections && item.sections.length > 0
      ? item.sections
      : [
          {
            heading: 'Overview & Legal Analysis',
            paragraphs:
              contentParagraphs.length > 0
                ? contentParagraphs
                : [item.excerpt || item.title],
          },
        ];

  return {
    id: index + 1,
    slug: item.slug || item.id,
    title: item.title,
    subtitle: item.subtitle || item.excerpt,
    excerpt: item.excerpt,
    category: item.category,
    image: item.image || gavelImg,
    imageCaption: item.imageCaption || `${item.title} — ${item.category}`,
    number: item.number || String(index + 1).padStart(2, '0'),
    readTime: item.readTime || '5 min read',
    publishedDate: item.publishedDate || item.date,
    author: {
      name: authorName,
      role: authorRole,
      credentials: authorCredentials,
    },
    date: item.date,
    content: contentParagraphs[0] || item.excerpt || '',
    sections,
    pullQuote: item.pullQuote || item.excerpt || item.title,
    keyTakeaways: item.keyTakeaways || [],
    statutesReferenced:
      item.statutesReferenced && item.statutesReferenced.length > 0
        ? item.statutesReferenced
        : ['Code of Civil Procedure 1908', 'Income Tax Ordinance 2001'],
  };
}

export function mapInsightsToPosts(items: LegalInsightItem[]): InsightPost[] {
  const published = (items || []).filter(
    (item) => item.status === 'published' || !item.status
  );
  return published.map((item, idx) => mapInsightItemToPost(item, idx));
}

export function deriveInsightCategories(posts: InsightPost[]): string[] {
  const unique = Array.from(new Set(posts.map((p) => p.category).filter(Boolean)));
  return ['All Publications', ...unique];
}
