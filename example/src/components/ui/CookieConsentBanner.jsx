import React, { useState, useEffect } from 'react';

const CookieConsentBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    // Check if user has already been informed about cookies
    const cookieConsent = localStorage.getItem('cookie_consent');
    if (!cookieConsent) {
      // Show banner after a short delay for better UX
      setTimeout(() => {
        setShowBanner(true);
      }, 500);
    }

    // Detect language from browser or localStorage
    const savedLanguage = localStorage.getItem('app_language') || 
                          (navigator.language.startsWith('th') ? 'th' : 'en');
    setLanguage(savedLanguage);
  }, []);

  const handleAcknowledge = () => {
    // Store that user has been informed (not consent, just acknowledgment)
    // Essential cookies don't require consent under GDPR/PDPA
    localStorage.setItem('cookie_consent', 'informed');
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  const content = {
    en: {
      title: 'Cookie Information',
      message: 'This app uses only essential cookies and local storage to manage authentication, sessions, and test progress. These functions are necessary for the app to operate correctly and do not require user consent under GDPR or Thailand\'s PDPA. No tracking or advertising cookies are used.',
      acknowledge: 'I Understand',
      learnMore: 'Learn More',
      privacyLink: '/privacy'
    },
    th: {
      title: 'ข้อมูลเกี่ยวกับคุกกี้',
      message: 'แอปนี้ใช้เฉพาะคุกกี้และการเก็บข้อมูลในเครื่องที่จำเป็นสำหรับการจัดการการยืนยันตัวตน เซสชัน และความคืบหน้าการทดสอบ ฟังก์ชันเหล่านี้จำเป็นสำหรับการทำงานของแอปและไม่ต้องขอความยินยอมจากผู้ใช้ตามกฎหมาย GDPR หรือ PDPA ของประเทศไทย ไม่มีการใช้คุกกี้เพื่อการติดตามหรือโฆษณา',
      acknowledge: 'เข้าใจแล้ว',
      learnMore: 'เรียนรู้เพิ่มเติม',
      privacyLink: '/privacy'
    }
  };

  const t = content[language];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-6">
      <div className="max-w-4xl mx-auto rounded-lg shadow-2xl border-2 bg-white">
        <div className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold mb-2 text-gray-900">
                {t.title}
              </h3>
              <p className="text-sm text-gray-700">
                {t.message}
              </p>
              <a
                href={t.privacyLink}
                className="text-sm mt-2 inline-block underline text-blue-600 hover:text-blue-800"
              >
                {t.learnMore}
              </a>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-auto sm:w-auto">
              <button
                onClick={handleAcknowledge}
                className="font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer px-4 py-2 text-sm sm:px-3 sm:py-1.5 sm:text-sm bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 whitespace-nowrap"
              >
                {t.acknowledge}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
