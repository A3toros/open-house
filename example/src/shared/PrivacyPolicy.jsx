import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  const [language, setLanguage] = useState('en'); // Default to English

  // English content
  const content = {
    en: {
      title: 'Privacy Policy',
      subtitle: 'App: MWS Student App',
      website: 'Website: mathayomwatsing.netlify.app',
      lastUpdated: 'Last updated:',
      introduction: {
        title: 'Introduction',
        text1: 'The MWS Student App is an independent educational project created by Aleksandr Petrov to provide learning tools for students. This app is not officially affiliated with or endorsed by Mathayomwatsing School.',
        text2: 'This Privacy Policy explains how we collect, use, store, and protect personal information. By using this app, you agree to this policy.',
        dataController: 'Independent Developer:',
        dataControllerText: 'Aleksandr Petrov is responsible for managing and protecting personal data collected through the MWS Student App and Website: mathayomwatsing.netlify.app',
        pdpaTitle: 'PDPA Compliance',
        pdpaText: 'This app complies with Thailand\'s Personal Data Protection Act, B.E. 2562 (PDPA). We are committed to protecting your personal data in accordance with PDPA requirements, including lawful collection, purpose limitation, data minimization, accuracy, security, and your rights as a data subject.',
      },
      consent: {
        title: 'User Consent',
        text1: 'Users (or their parents/legal guardians if under 18) consent to data collection and usage as described in this policy.',
        text2: 'If you do not agree, please do not use the app. Continued use after updates to this policy constitutes acceptance.',
      },
      appPurpose: {
        title: 'App Purpose',
        text: 'The MWS Student App (Independent Project) enables students to:',
        items: [
          'Take online tests and assessments',
          'View test results and academic progress',
          'Track learning achievements and performance',
          'Access educational content and resources',
        ],
      },
      childrenPrivacy: {
        title: "Children's Privacy",
        text1: 'The MWS Student App is designed for students. We do not knowingly collect more data than necessary to provide educational functionality.',
        text2: "Parents or guardians may contact the app developer to review, delete, or request updates to a student's information. We comply with COPPA (Children's Online Privacy Protection Act), Thailand's PDPA (Personal Data Protection Act, B.E. 2562), and equivalent child-data protection laws applicable in your jurisdiction.",
      },
      dataCollection: {
        title: 'Data Collection',
        text: 'We collect only the data necessary to provide educational functionality:',
        accountInfo: {
          title: 'Account Information',
          text: 'Student name, ID, grade, and class (for authentication and personalization).',
        },
        testData: {
          title: 'Test Data',
          text: 'Answers, scores, progress, and completion status.',
        },
        usageData: {
          title: 'Usage Data',
          text: 'App interactions, feature usage, and error logs (to improve functionality and stability).',
        },
        important: 'Important:',
        importantText: 'This app does not use or share personal data for advertising or commercial purposes. All data collection is strictly for educational and assessment use. We comply with COPPA (Children\'s Online Privacy Protection Act), Thailand\'s PDPA (Personal Data Protection Act, B.E. 2562), and equivalent child-data protection laws. This app does not display advertisements or use tracking SDKs.',
      },
      dataUsage: {
        title: 'How We Use Your Data',
        text: 'Your data is used exclusively for educational purposes:',
        items: [
          'Deliver and maintain educational services',
          'Track learning progress and achievements',
          'Provide feedback on academic performance',
          'Improve app functionality and user experience',
          'Provide technical support',
        ],
      },
      cookies: {
        title: 'Cookies and Local Storage',
        text1: 'This app uses cookies and local storage technologies to provide essential functionality and improve your experience.',
        essentialCookies: {
          title: 'Essential Cookies and Storage',
          text: 'We use essential cookies and local storage for:',
          items: [
            'Authentication: Storing login tokens to keep you signed in securely',
            'Session Management: Maintaining your active session during app usage',
            'Test Progress: Saving your test progress locally to prevent data loss',
            'User Preferences: Storing your theme preferences and settings',
          ],
          note: 'These essential cookies and storage are necessary for the app to function properly and cannot be disabled.',
        },
        storageTypes: {
          title: 'Types of Storage Used',
          text: 'We use the following storage mechanisms:',
          httpCookies: {
            title: 'HTTP Cookies',
            text: 'Secure, HttpOnly cookies for authentication tokens. These cookies are essential for maintaining your login session and are automatically deleted when you log out.',
          },
          localStorage: {
            title: 'Local Storage',
            text: 'Browser local storage for user data, test progress, and preferences. This data remains on your device until you clear your browser data or log out.',
          },
          sessionStorage: {
            title: 'Session Storage',
            text: 'Temporary session storage used as a fallback when local storage is unavailable. This data is automatically cleared when you close your browser.',
          },
        },
        cookieManagement: {
          title: 'Managing Cookies and Storage',
          text: 'You can manage cookies and local storage through your browser settings. However, disabling essential cookies or storage may prevent the app from functioning correctly. To clear stored data, you can:',
          items: [
            'Log out of the app, which will clear authentication tokens',
            'Clear your browser\'s cookies and local storage through browser settings',
            'Contact us at aleksandr.p@mws.ac.th to request data deletion',
          ],
        },
        thirdPartyCookies: {
          title: 'Third-Party Cookies',
          text: 'This app does not use third-party cookies for advertising or tracking purposes. We do not share cookie data with third parties.',
        },
        consent: {
          title: 'Cookie Consent',
          text: 'By using this app, you consent to the use of essential cookies and local storage as described in this policy. These are necessary for the app\'s core functionality and security.',
        },
      },
      dataStorage: {
        title: 'Data Storage & Security',
        text1: 'Data is stored securely, locally on devices, or on encrypted cloud servers (Supabase). All transmissions are encrypted.',
        text2: 'Technical and organizational measures are applied to prevent unauthorized access, alteration, disclosure, or destruction.',
      },
      dataHosting: {
        title: 'Data Hosting',
        text1: 'The app\'s data is securely stored using trusted cloud infrastructure (Supabase). These services comply with global security standards including GDPR and ISO 27001.',
        text2: 'All data hosting providers are contractually obligated to maintain the same level of data protection and security as outlined in this Privacy Policy. Data is stored in secure, encrypted databases with regular backups and monitoring.',
      },
      dataSharing: {
        title: 'Data Sharing and Disclosure',
        text: 'We do not sell, rent, or trade user data. Data may be shared only:',
        schoolAdmin: {
          title: 'Parents/Guardians:',
          text: 'With parents/guardians for their child’s data review.',
        },
        legal: {
          title: 'Legal Requirements:',
          text: 'For legal obligations, if required by law or in response to valid legal requests.',
        },
        serviceProviders: {
          title: 'Service Providers:',
          text: 'With trusted service providers (bound by contracts to protect data and use it only for specified purposes).',
        },
      },
      academicIntegrity: {
        title: 'Academic Integrity',
        text: 'The app includes anti-cheating measures to ensure fair assessment. This includes monitoring app state changes, preventing unauthorized actions during tests, and detecting suspicious behavior. By using this app, you agree to maintain academic honesty and integrity.',
      },
      userRights: {
        title: 'Your Rights',
        text: 'Users have the right to:',
        items: [
          'Access, correct, or delete personal data',
          'Object to processing of personal data',
          'Request data portability',
        ],
        contact: 'To exercise these rights, please contact app developer at aleksandr.p@mws.ac.th',
        pdpaTitle: 'Under Thailand\'s PDPA, you have the right to:',
        pdpaItems: [
          'Access and obtain a copy of your personal data',
          'Request correction of any incomplete or inaccurate information',
          'Request deletion or suspension of use of your personal data',
          'Withdraw consent at any time (where applicable)',
          'Lodge a complaint with the Personal Data Protection Committee (PDPC) if you believe your data has been mishandled',
        ],
      },
      dataRetention: {
        title: 'Data Retention',
        text: 'We retain personal data only as long as necessary to provide educational services and comply with legal obligations. Academic records may be retained according to educational data retention requirements.',
      },
      changes: {
        title: 'Changes to This Privacy Policy',
        text: 'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.',
      },
      contact: {
        title: 'Contact',
        text: 'For privacy inquiries, contact:',
        school: 'Aleksandr Petrov',
        email: 'aleksandr.p@mws.ac.th',
      },
      backToLogin: '← Back to Login',
    },
    th: {
      title: 'นโยบายความเป็นส่วนตัว',
      subtitle: 'แอป: MWS Student App',
      website: 'เว็บไซต์: mathayomwatsing.netlify.app',
      lastUpdated: 'อัปเดตล่าสุด:',
      introduction: {
        title: 'บทนำ',
        text1: 'MWS Student App เป็นโครงการการศึกษาอิสระที่พัฒนาโดย Aleksandr Petrov เพื่อมอบเครื่องมือการเรียนรู้สำหรับนักเรียน แอปนี้ไม่ได้มีความเกี่ยวข้องหรือได้รับการรับรองอย่างเป็นทางการจากโรงเรียนมัธยมวัดสิงห์',
        text2: 'นโยบายความเป็นส่วนตัวนี้อธิบายว่าเรารวบรวม ใช้ เก็บ และปกป้องข้อมูลส่วนบุคคลอย่างไร โดยการใช้งานแอปนี้ถือว่าคุณยอมรับนโยบายนี้',
        dataController: 'ผู้พัฒนาอิสระ:',
        dataControllerText: 'Aleksandr Petrov มีความรับผิดชอบในการจัดการและปกป้องข้อมูลส่วนบุคคลที่รวบรวมผ่าน MWS Student App เว็บไซต์: mathayomwatsing.netlify.app',
        pdpaTitle: 'การปฏิบัติตาม PDPA',
        pdpaText: 'แอปนี้เป็นไปตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) เรามุ่งมั่นในการปกป้องข้อมูลส่วนบุคคลของคุณตามข้อกำหนดของ PDPA รวมถึงการเก็บรวบรวมอย่างถูกกฎหมาย การจำกัดวัตถุประสงค์ การลดข้อมูลให้น้อยที่สุด ความถูกต้อง ความปลอดภัย และสิทธิของคุณในฐานะเจ้าของข้อมูล',
      },
      consent: {
        title: 'ความยินยอมของผู้ใช้',
        text1: 'ผู้ใช้ (หรือผู้ปกครอง/ผู้ปกครองตามกฎหมายหากอายุต่ำกว่า 18 ปี) ยินยอมให้มีการเก็บรวบรวมและใช้ข้อมูลตามที่ระบุไว้ในนโยบายนี้',
        text2: 'หากคุณไม่เห็นด้วย โปรดอย่าใช้แอป การใช้งานต่อหลังจากมีการอัปเดตนโยบายนี้ถือเป็นการยอมรับ',
      },
      appPurpose: {
        title: 'วัตถุประสงค์ของแอป',
        text: 'MWS Student App (โครงการอิสระ) ช่วยให้นักเรียนสามารถ:',
        items: [
          'ทำแบบทดสอบและการประเมินออนไลน์',
          'ดูผลการทดสอบและความก้าวหน้าทางวิชาการ',
          'ติดตามความสำเร็จและผลการเรียน',
          'เข้าถึงเนื้อหาและทรัพยากรทางการศึกษา',
        ],
      },
      childrenPrivacy: {
        title: 'ความเป็นส่วนตัวของเด็ก',
        text1: 'แอปถูกออกแบบมาสำหรับนักเรียน เราไม่เก็บข้อมูลมากกว่าที่จำเป็นในการให้บริการด้านการศึกษา',
        text2: 'ผู้ปกครองหรือผู้ปกครองสามารถติดต่อนักพัฒนาแอปเพื่อตรวจสอบ ลบ หรือขออัปเดตข้อมูลของนักเรียน เราเป็นไปตาม COPPA (พระราชบัญญัติคุ้มครองความเป็นส่วนตัวออนไลน์ของเด็ก) พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) และกฎหมายคุ้มครองข้อมูลเด็กที่เทียบเท่าในเขตอำนาจของคุณ',
      },
      dataCollection: {
        title: 'การรวบรวมข้อมูล',
        text: 'เรารวบรวมเฉพาะข้อมูลที่จำเป็นต่อการให้บริการด้านการศึกษา:',
        accountInfo: {
          title: 'ข้อมูลบัญชี',
          text: 'ชื่อนักเรียน รหัสนักเรียน ระดับชั้น และห้องเรียน (เพื่อการยืนยันตัวตนและการปรับแต่ง)',
        },
        testData: {
          title: 'ข้อมูลการทดสอบ',
          text: 'คำตอบ คะแนน ความคืบหน้า และสถานะการทำแบบทดสอบ',
        },
        usageData: {
          title: 'ข้อมูลการใช้งาน',
          text: 'การโต้ตอบกับแอป การใช้งานฟีเจอร์ และบันทึกข้อผิดพลาด (เพื่อปรับปรุงการทำงาน)',
        },
        important: 'สำคัญ:',
        importantText: 'แอปนี้ไม่ใช้หรือแชร์ข้อมูลส่วนบุคคลเพื่อการโฆษณาหรือวัตถุประสงค์ทางการค้า การรวบรวมข้อมูลทั้งหมดใช้เพื่อการศึกษาและการประเมินเท่านั้น เราเป็นไปตาม COPPA (พระราชบัญญัติคุ้มครองความเป็นส่วนตัวออนไลน์ของเด็ก) พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) และกฎหมายคุ้มครองข้อมูลเด็กที่เทียบเท่า แอปนี้ไม่แสดงโฆษณาหรือใช้ SDK การติดตาม',
      },
      dataUsage: {
        title: 'วิธีที่เราใช้ข้อมูลของคุณ',
        text: 'ข้อมูลของคุณใช้เพื่อวัตถุประสงค์ทางการศึกษาเท่านั้น:',
        items: [
          'ให้และรักษาบริการทางการศึกษา',
          'ติดตามความก้าวหน้าและความสำเร็จในการเรียนรู้',
          'ให้ข้อเสนอแนะด้านผลการเรียน',
          'ปรับปรุงฟังก์ชันการทำงานของแอปและประสบการณ์ผู้ใช้',
          'ให้การสนับสนุนทางเทคนิค',
        ],
      },
      cookies: {
        title: 'คุกกี้และการเก็บข้อมูลในเครื่อง',
        text1: 'แอปนี้ใช้คุกกี้และเทคโนโลยีการเก็บข้อมูลในเครื่องเพื่อให้บริการที่จำเป็นและปรับปรุงประสบการณ์ของคุณ',
        essentialCookies: {
          title: 'คุกกี้และการเก็บข้อมูลที่จำเป็น',
          text: 'เราใช้คุกกี้และการเก็บข้อมูลที่จำเป็นสำหรับ:',
          items: [
            'การยืนยันตัวตน: เก็บโทเค็นการเข้าสู่ระบบเพื่อให้คุณเข้าสู่ระบบอย่างปลอดภัย',
            'การจัดการเซสชัน: รักษาเซสชันที่ใช้งานอยู่ระหว่างการใช้แอป',
            'ความคืบหน้าการทดสอบ: บันทึกความคืบหน้าการทดสอบในเครื่องเพื่อป้องกันการสูญหายของข้อมูล',
            'การตั้งค่าผู้ใช้: เก็บการตั้งค่าธีมและการตั้งค่าของคุณ',
          ],
          note: 'คุกกี้และการเก็บข้อมูลที่จำเป็นเหล่านี้จำเป็นสำหรับการทำงานของแอปและไม่สามารถปิดการใช้งานได้',
        },
        storageTypes: {
          title: 'ประเภทของการเก็บข้อมูลที่ใช้',
          text: 'เราใช้กลไกการเก็บข้อมูลต่อไปนี้:',
          httpCookies: {
            title: 'คุกกี้ HTTP',
            text: 'คุกกี้ที่ปลอดภัย HttpOnly สำหรับโทเค็นการยืนยันตัวตน คุกกี้เหล่านี้จำเป็นสำหรับการรักษาเซสชันการเข้าสู่ระบบของคุณและจะถูกลบอัตโนมัติเมื่อคุณออกจากระบบ',
          },
          localStorage: {
            title: 'การเก็บข้อมูลในเครื่อง',
            text: 'การเก็บข้อมูลในเบราว์เซอร์สำหรับข้อมูลผู้ใช้ ความคืบหน้าการทดสอบ และการตั้งค่า ข้อมูลนี้จะยังคงอยู่ในอุปกรณ์ของคุณจนกว่าคุณจะล้างข้อมูลเบราว์เซอร์หรือออกจากระบบ',
          },
          sessionStorage: {
            title: 'การเก็บข้อมูลเซสชัน',
            text: 'การเก็บข้อมูลเซสชันชั่วคราวที่ใช้เป็นทางเลือกเมื่อการเก็บข้อมูลในเครื่องไม่พร้อมใช้งาน ข้อมูลนี้จะถูกล้างอัตโนมัติเมื่อคุณปิดเบราว์เซอร์',
          },
        },
        cookieManagement: {
          title: 'การจัดการคุกกี้และการเก็บข้อมูล',
          text: 'คุณสามารถจัดการคุกกี้และการเก็บข้อมูลในเครื่องผ่านการตั้งค่าเบราว์เซอร์ของคุณ อย่างไรก็ตาม การปิดการใช้งานคุกกี้หรือการเก็บข้อมูลที่จำเป็นอาจทำให้แอปไม่สามารถทำงานได้อย่างถูกต้อง หากต้องการล้างข้อมูลที่เก็บไว้ คุณสามารถ:',
          items: [
            'ออกจากระบบแอป ซึ่งจะล้างโทเค็นการยืนยันตัวตน',
            'ล้างคุกกี้และการเก็บข้อมูลในเครื่องของเบราว์เซอร์ผ่านการตั้งค่าเบราว์เซอร์',
            'ติดต่อเราที่ aleksandr.p@mws.ac.th เพื่อขอให้ลบข้อมูล',
          ],
        },
        thirdPartyCookies: {
          title: 'คุกกี้ของบุคคลที่สาม',
          text: 'แอปนี้ไม่ใช้คุกกี้ของบุคคลที่สามเพื่อการโฆษณาหรือการติดตาม เราไม่แชร์ข้อมูลคุกกี้กับบุคคลที่สาม',
        },
        consent: {
          title: 'ความยินยอมในการใช้คุกกี้',
          text: 'โดยการใช้แอปนี้ คุณยินยอมให้ใช้คุกกี้และการเก็บข้อมูลในเครื่องที่จำเป็นตามที่ระบุไว้ในนโยบายนี้ สิ่งเหล่านี้จำเป็นสำหรับการทำงานหลักและความปลอดภัยของแอป',
        },
      },
      dataStorage: {
        title: 'การเก็บข้อมูลและความปลอดภัย',
        text1: 'ข้อมูลถูกเก็บไว้อย่างปลอดภัย ทั้งในอุปกรณ์และบนเซิร์ฟเวอร์คลาวด์ที่เข้ารหัส (Supabase) การส่งข้อมูลทั้งหมดมีการเข้ารหัส',
        text2: 'มีมาตรการทางเทคนิคและองค์กรเพื่อป้องกันการเข้าถึง การแก้ไข การเปิดเผย หรือการทำลายโดยไม่ได้รับอนุญาต',
      },
      dataHosting: {
        title: 'การโฮสต์ข้อมูล',
        text1: 'ข้อมูลของแอปถูกเก็บไว้อย่างปลอดภัยโดยใช้โครงสร้างพื้นฐานคลาวด์ที่เชื่อถือได้ (Supabase) บริการเหล่านี้เป็นไปตามมาตรฐานความปลอดภัยระดับโลกรวมถึง GDPR และ ISO 27001',
        text2: 'ผู้ให้บริการโฮสต์ข้อมูลทั้งหมดมีภาระผูกพันตามสัญญาในการรักษาระดับการปกป้องข้อมูลและความปลอดภัยเช่นเดียวกับที่ระบุไว้ในนโยบายความเป็นส่วนตัวนี้ ข้อมูลถูกเก็บไว้ในฐานข้อมูลที่เข้ารหัสอย่างปลอดภัยพร้อมการสำรองข้อมูลและการตรวจสอบเป็นประจำ',
      },
      dataSharing: {
        title: 'การแชร์และการเปิดเผยข้อมูล',
        text: 'เราไม่ขาย แลกเปลี่ยน หรือให้เช่าข้อมูลผู้ใช้ ข้อมูลอาจถูกแชร์เฉพาะ:',
        schoolAdmin: {
          title: 'ผู้ปกครอง/ผู้ปกครอง:',
          text: 'กับผู้ปกครอง/ผู้ปกครองเพื่อตรวจสอบข้อมูลของบุตรหลาน',
        },
        legal: {
          title: 'ข้อกำหนดทางกฎหมาย:',
          text: 'เพื่อภาระผูกพันทางกฎหมาย หากกฎหมายกำหนดหรือเพื่อตอบสนองต่อคำขอทางกฎหมายที่ถูกต้อง',
        },
        serviceProviders: {
          title: 'ผู้ให้บริการ:',
          text: 'กับผู้ให้บริการที่เชื่อถือได้ (ผูกพันตามสัญญาในการปกป้องข้อมูลและใช้เฉพาะเพื่อวัตถุประสงค์ที่ระบุ)',
        },
      },
      academicIntegrity: {
        title: 'ความซื่อสัตย์ทางวิชาการ',
        text: 'แอปรวมมาตรการต่อต้านการโกงเพื่อรับประกันการประเมินที่ยุติธรรม ซึ่งรวมถึงการตรวจสอบการเปลี่ยนแปลงสถานะแอป การป้องกันการกระทำที่ไม่ได้รับอนุญาตระหว่างการทดสอบ และการตรวจจับพฤติกรรมที่น่าสงสัย โดยการใช้แอปนี้ คุณตกลงที่จะรักษาความซื่อสัตย์และความซื่อตรงทางวิชาการ',
      },
      userRights: {
        title: 'สิทธิของคุณ',
        text: 'ผู้ใช้มีสิทธิ์:',
        items: [
          'เข้าถึง แก้ไข หรือลบข้อมูลส่วนบุคคล',
          'คัดค้านการประมวลผลข้อมูลส่วนบุคคล',
          'ขอการพกพาข้อมูล',
        ],
        contact: 'เพื่อใช้สิทธิ์เหล่านี้ โปรดติดต่อนักพัฒนาแอปที่ aleksandr.p@mws.ac.th',
        pdpaTitle: 'ภายใต้พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) ของประเทศไทย คุณมีสิทธิ์:',
        pdpaItems: [
          'เข้าถึงและขอสำเนาข้อมูลส่วนบุคคลของคุณ',
          'ขอแก้ไขข้อมูลที่ไม่สมบูรณ์หรือไม่ถูกต้อง',
          'ขอลบหรือระงับการใช้ข้อมูลส่วนบุคคลของคุณ',
          'ถอนความยินยอมได้ตลอดเวลา (ในกรณีที่ใช้บังคับ)',
          'ยื่นคำร้องต่อคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล (PDPC) หากคุณเชื่อว่าข้อมูลของคุณถูกละเมิด',
        ],
      },
      dataRetention: {
        title: 'การเก็บรักษาข้อมูล',
        text: 'เราจะเก็บรักษาข้อมูลส่วนบุคคลเฉพาะเท่าที่จำเป็นในการให้บริการด้านการศึกษาและปฏิบัติตามข้อกำหนดทางกฎหมาย บันทึกทางวิชาการอาจถูกเก็บรักษาตามข้อกำหนดการเก็บรักษาข้อมูลทางการศึกษา',
      },
      changes: {
        title: 'การเปลี่ยนแปลงนโยบายความเป็นส่วนตัวนี้',
        text: 'เราอาจอัปเดตนโยบายความเป็นส่วนตัวนี้เป็นครั้งคราว เราจะแจ้งให้คุณทราบถึงการเปลี่ยนแปลงใดๆ โดยการโพสต์นโยบายความเป็นส่วนตัวใหม่ในหน้านี้และอัปเดตวันที่ "อัปเดตล่าสุด" แนะนำให้คุณตรวจสอบนโยบายความเป็นส่วนตัวนี้เป็นระยะเพื่อดูการเปลี่ยนแปลงใดๆ',
      },
      contact: {
        title: 'ติดต่อ',
        text: 'สำหรับคำถามด้านความเป็นส่วนตัว โปรดติดต่อ:',
        school: 'Aleksandr Petrov',
        email: 'aleksandr.p@mws.ac.th',
      },
      backToLogin: '← กลับไปหน้าเข้าสู่ระบบ',
    },
  };

  const t = content[language];
  const currentDate = new Date().toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 mb-8">
          <div className="px-6 py-6 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {t.title}
                </h1>
                <p className="text-sm text-gray-600">
                  {t.subtitle}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {t.website}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {t.lastUpdated} {currentDate}
                </p>
              </div>
              {/* Language Toggle Buttons */}
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    language === 'en'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage('th')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    language === 'th'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  ไทย
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 sm:p-8 space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t.introduction.title}
            </h2>
            <p className="text-base leading-7 text-gray-700">
              {t.introduction.text1}
            </p>
            <p className="text-base leading-7 text-gray-700 mt-4">
              {t.introduction.text2}
            </p>
            
            {/* Data Controller */}
            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm leading-6 text-gray-700">
                <span className="font-semibold">{t.introduction.dataController}</span> {t.introduction.dataControllerText}
              </p>
            </div>

            {/* PDPA Compliance Notice */}
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm leading-6 text-blue-800">
                <span className="font-semibold">{t.introduction.pdpaTitle}:</span> {t.introduction.pdpaText}
              </p>
            </div>
          </section>

          {/* User Consent */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t.consent.title}
            </h2>
            <p className="text-base leading-7 text-gray-700">
              {t.consent.text1}
            </p>
            <p className="text-base leading-7 text-gray-700 mt-4">
              {t.consent.text2}
            </p>
          </section>

          {/* App Purpose */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t.appPurpose.title}
            </h2>
            <p className="text-base leading-7 text-gray-700">
              {t.appPurpose.text}
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 text-base leading-7 text-gray-700 ml-4">
              {t.appPurpose.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t.childrenPrivacy.title}
            </h2>
            <p className="text-base leading-7 text-gray-700">
              {t.childrenPrivacy.text1}
            </p>
            <p className="text-base leading-7 text-gray-700 mt-4">
              {t.childrenPrivacy.text2}
            </p>
          </section>

          {/* Data Collection */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t.dataCollection.title}
            </h2>
            <p className="text-base leading-7 text-gray-700 mb-4">
              {t.dataCollection.text}
            </p>

            <div className="space-y-4">
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{t.dataCollection.accountInfo.title}</h3>
                <p className="text-sm text-gray-700">
                  {t.dataCollection.accountInfo.text}
                </p>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{t.dataCollection.testData.title}</h3>
                <p className="text-sm text-gray-700">
                  {t.dataCollection.testData.text}
                </p>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{t.dataCollection.usageData.title}</h3>
                <p className="text-sm text-gray-700">
                  {t.dataCollection.usageData.text}
                </p>
              </div>

            </div>

            {/* COPPA Compliance Notice */}
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm leading-6 text-yellow-800">
                <span className="font-semibold">{t.dataCollection.important}</span> {t.dataCollection.importantText}
              </p>
            </div>
          </section>

          {/* Data Usage */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t.dataUsage.title}
            </h2>
            <p className="text-base leading-7 text-gray-700 mb-4">
              {t.dataUsage.text}
            </p>
            <ul className="list-disc list-inside space-y-2 text-base leading-7 text-gray-700 ml-4">
              {t.dataUsage.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* Cookies and Local Storage */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t.cookies.title}
            </h2>
            <p className="text-base leading-7 text-gray-700 mb-4">
              {t.cookies.text1}
            </p>

            {/* Essential Cookies */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">{t.cookies.essentialCookies.title}</h3>
              <p className="text-sm text-gray-700 mb-2">
                {t.cookies.essentialCookies.text}
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
                {t.cookies.essentialCookies.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              <p className="text-sm text-gray-700 mt-2 italic">
                {t.cookies.essentialCookies.note}
              </p>
            </div>

            {/* Storage Types */}
            <div className="space-y-4 mb-4">
              <h3 className="font-semibold text-gray-900">{t.cookies.storageTypes.title}</h3>
              <p className="text-sm text-gray-700 mb-3">
                {t.cookies.storageTypes.text}
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">{t.cookies.storageTypes.httpCookies.title}</h4>
                <p className="text-sm text-gray-700">
                  {t.cookies.storageTypes.httpCookies.text}
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">{t.cookies.storageTypes.localStorage.title}</h4>
                <p className="text-sm text-gray-700">
                  {t.cookies.storageTypes.localStorage.text}
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">{t.cookies.storageTypes.sessionStorage.title}</h4>
                <p className="text-sm text-gray-700">
                  {t.cookies.storageTypes.sessionStorage.text}
                </p>
              </div>
            </div>

            {/* Cookie Management */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">{t.cookies.cookieManagement.title}</h3>
              <p className="text-sm text-gray-700 mb-2">
                {t.cookies.cookieManagement.text}
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
                {t.cookies.cookieManagement.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Third-Party Cookies */}
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">{t.cookies.thirdPartyCookies.title}</h3>
              <p className="text-sm text-gray-700">
                {t.cookies.thirdPartyCookies.text}
              </p>
            </div>

            {/* Cookie Consent */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">{t.cookies.consent.title}</h3>
              <p className="text-sm text-gray-700">
                {t.cookies.consent.text}
              </p>
            </div>
          </section>

          {/* Data Storage */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t.dataStorage.title}
            </h2>
            <p className="text-base leading-7 text-gray-700">
              {t.dataStorage.text1}
            </p>
            <p className="text-base leading-7 text-gray-700 mt-4">
              {t.dataStorage.text2}
            </p>
          </section>

          {/* Data Hosting */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t.dataHosting.title}
            </h2>
            <p className="text-base leading-7 text-gray-700">
              {t.dataHosting.text1}
            </p>
            <p className="text-base leading-7 text-gray-700 mt-4">
              {t.dataHosting.text2}
            </p>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t.dataSharing.title}
            </h2>
            <p className="text-base leading-7 text-gray-700">
              {t.dataSharing.text}
            </p>
            <ul className="list-disc list-inside space-y-2 text-base leading-7 text-gray-700 ml-4 mt-4">
              <li>
                <strong>{t.dataSharing.schoolAdmin.title}</strong> {t.dataSharing.schoolAdmin.text}
              </li>
              <li>
                <strong>{t.dataSharing.legal.title}</strong> {t.dataSharing.legal.text}
              </li>
              <li>
                <strong>{t.dataSharing.serviceProviders.title}</strong> {t.dataSharing.serviceProviders.text}
              </li>
            </ul>
          </section>

          {/* Academic Integrity */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t.academicIntegrity.title}
            </h2>
            <p className="text-base leading-7 text-gray-700">
              {t.academicIntegrity.text}
            </p>
          </section>

          {/* User Rights */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t.userRights.title}
            </h2>
            <p className="text-base leading-7 text-gray-700 mb-4">
              {t.userRights.text}
            </p>
            <ul className="list-disc list-inside space-y-2 text-base leading-7 text-gray-700 ml-4">
              {t.userRights.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <p className="text-base leading-7 text-gray-700 mt-4">
              {language === 'en' 
                ? <>To exercise these rights, please contact app developer at{' '}
                    <a
                      href="mailto:aleksandr.p@mws.ac.th"
                      className="text-blue-600 hover:text-blue-800 underline font-medium"
                    >
                      aleksandr.p@mws.ac.th
                    </a>
                  </>
                : <>เพื่อใช้สิทธิ์เหล่านี้ โปรดติดต่อนักพัฒนาแอปที่{' '}
                    <a
                      href="mailto:aleksandr.p@mws.ac.th"
                      className="text-blue-600 hover:text-blue-800 underline font-medium"
                    >
                      aleksandr.p@mws.ac.th
                    </a>
                  </>
              }
            </p>

            {/* PDPA Rights Reminder */}
            <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {t.userRights.pdpaTitle}
              </h3>
              <ul className="list-disc list-inside space-y-2 text-sm leading-6 text-gray-700 ml-2">
                {t.userRights.pdpaItems.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t.dataRetention.title}
            </h2>
            <p className="text-base leading-7 text-gray-700">
              {t.dataRetention.text}
            </p>
          </section>

          {/* Changes to Privacy Policy */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t.changes.title}
            </h2>
            <p className="text-base leading-7 text-gray-700">
              {t.changes.text}
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t.contact.title}
            </h2>
            <p className="text-base leading-7 text-gray-700">
              {t.contact.text}
            </p>
            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-base text-gray-700">
                <strong>{t.contact.school}</strong>
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <a
                  href={`mailto:${t.contact.email}`}
                  className="text-blue-600 hover:text-blue-800 underline font-medium"
                >
                  {t.contact.email}
                </a>
              </p>
            </div>
          </section>

          {/* Footer */}
          <div className="pt-6 border-t border-gray-200 mt-8">
            <Link
              to="/login"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              {t.backToLogin}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

