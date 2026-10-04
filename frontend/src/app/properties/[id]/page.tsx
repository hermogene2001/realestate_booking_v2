import PropertyDetailClient from './PropertyDetailClient';

export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function PropertyDetailPage() {
  return <PropertyDetailClient />;
}
