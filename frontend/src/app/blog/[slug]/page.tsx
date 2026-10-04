import BlogDetailClient from './BlogDetailClient';

export function generateStaticParams() {
  return [{ slug: 'placeholder' }];
}

export default function BlogDetailPage() {
  return <BlogDetailClient />;
}
