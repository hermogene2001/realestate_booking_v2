import BookingsDetailClient from './BookingsDetailClient';

export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function BookingsDetailPage() {
  return <BookingsDetailClient />;
}
