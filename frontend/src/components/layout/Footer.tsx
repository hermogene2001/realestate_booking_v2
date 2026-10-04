'use client';

import { useTranslation } from '@/context/LanguageContext';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-900 text-gray-400 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">KR</span>
              </div>
              <span className="font-bold text-lg text-white">Kigali Real Estate</span>
            </div>
            <p className="text-sm">{t('home.description')}</p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.districts')}</h3>
            <ul className="space-y-2 text-sm">
              <li>{t('footer.gasabo')}</li>
              <li>{t('footer.kicukiro')}</li>
              <li>{t('footer.nyarugenge')}</li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.contact')}</h3>
            <ul className="space-y-2 text-sm">
              <li>Kigali, Rwanda</li>
              <li>info@kigalire.rw</li>
              <li>+250 788 000 000</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Kigali Real Estate Booking. {t('footer.powered_by')}.</p>
        </div>
      </div>
    </footer>
  );
}
