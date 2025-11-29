export interface Slide {
  text: string
  textThai?: string
  image?: string
  imageType?: 'image' | 'video'
  imageDuration?: number // defaults to 3000ms
}

export const presentationSlides: Slide[] = [
  {
    text: 'In industrial world',
    textThai: 'ในโลกอุตสาหกรรม',
    image: '/pics/Factory.mp4',
    imageType: 'video',
    imageDuration: 5000,
  },
  {
    text: 'Ecology and nature are at risk',
    textThai: 'ระบบนิเวศและธรรมชาติกำลังตกอยู่ในความเสี่ยง',
  },
  {
    text: "That's why we care about environment",
    textThai: 'นั่นคือเหตุผลที่เราดูแลสิ่งแวดล้อม',
  },
  {
    text: 'And try to reduce the use of paper',
    textThai: 'และพยายามลดการใช้กระดาษ',
  },

  {
    text: 'We believe in the world',
    textThai: 'เราเชื่อในโลก',
  },
  {
    text: 'Free of pollution',
    textThai: 'ที่ปราศจากมลพิษ',
  },
  {
    text: 'Full of green trees',
    textThai: 'เต็มไปด้วยต้นไม้สีเขียว',
  },
  {
    text: 'Future of education',
    textThai: 'อนาคตของการศึกษา',
    image: '/pics/presentation/1.jpg',
    imageType: 'image',
    imageDuration: 2000,
  },
  {
    text: 'Is free of paper',
    textThai: 'คือการปราศจากกระดาษ',
    image: '/pics/presentation/2.jpg',
    imageType: 'image',
    imageDuration: 2000,
  },
  {
    text: 'Future of education',
    textThai: 'อนาคตของการศึกษา',
    image: '/pics/presentation/3.jpg',
    imageType: 'image',
    imageDuration: 2000,
  },
  {
    text: 'Is using AI only where necessary',
    textThai: 'คือการใช้ AI เฉพาะที่จำเป็นเท่านั้น',
    image: '/pics/presentation/4.jpg',
    imageType: 'image',
    imageDuration: 2000,
  },
  {
    text: 'Nothing can replace human contact',
    textThai: 'ไม่มีอะไรสามารถแทนที่การติดต่อของมนุษย์ได้',
    image: '/pics/presentation/11.jpg',
    imageType: 'image',
    imageDuration: 2000,
  },
  {
    text: 'But AI can help',
    textThai: 'แต่ AI สามารถช่วยได้',
    image: '/pics/presentation/5.jpg',
    imageType: 'image',
    imageDuration: 2000,
  },
  {
    text: 'When students struggle',
    textThai: 'เมื่อนักเรียนมีปัญหา',
    image: '/pics/presentation/6.jpg',
    imageType: 'image',
    imageDuration: 2000,
  },
  {
    text: 'It can lighten the load',
    textThai: 'มันสามารถลดภาระได้',
    image: '/pics/presentation/7.jpg',
    imageType: 'image',
    imageDuration: 2000,
  },
  {
    text: 'Technology empowers learning',
    textThai: 'เทคโนโลยีเสริมพลังการเรียนรู้',
    image: '/pics/presentation/8.jpg',
    imageType: 'image',
    imageDuration: 2000,
  },
  {
    text: 'Making education accessible to all',
    textThai: 'ทำให้การศึกษาสามารถเข้าถึงได้สำหรับทุกคน',
    image: '/pics/presentation/9.jpg',
    imageType: 'image',
    imageDuration: 2000,
  },
  {
    text: 'We embrace innovation',
    textThai: 'เรายอมรับนวัตกรรม',
    image: '/pics/presentation/10.jpg',
    imageType: 'image',
    imageDuration: 2000,
  },
  {
    text: 'While preserving human connection',
    textThai: 'ในขณะที่รักษาการเชื่อมต่อของมนุษย์',
  },
  {
    text: 'Together we build the future',
    textThai: 'ร่วมกันเราสร้างอนาคต',
  },
  {
    text: 'One student at a time',
    textThai: 'ทีละคน',
  },
  {
    text: 'Education without boundaries',
    textThai: 'การศึกษาไร้พรมแดน',
  },
  {
    text: 'Learning without limits',
    textThai: 'การเรียนรู้ไร้ขีดจำกัด',
  },
  {
    text: 'We use online testing with different test types',
    textThai: 'เราใช้การทดสอบออนไลน์ด้วยประเภทการทดสอบที่หลากหลาย',
    image: '/pics/Screenshot_2.png',
    imageType: 'image',
    imageDuration: 5000,
  },
  {
    text: 'Some of the tests are powered by AI',
    textThai: 'การทดสอบบางส่วนขับเคลื่อนด้วย AI',
    image: '/pics/Screenshot_3.png',
    imageType: 'image',
    imageDuration: 5000,
  },
  {
    text: 'AI gives feedback and teacher can later listen and edit the score',
    textThai: 'AI ให้ข้อเสนอแนะและครูสามารถฟังและแก้ไขคะแนนได้ภายหลัง',
    image: '/pics/Screenshot_4.png',
    imageType: 'image',
    imageDuration: 5000,
  },
  {
    text: 'Students can see their scores immediately and track their progress',
    textThai: 'นักเรียนสามารถดูคะแนนของตนได้ทันทีและติดตามความก้าวหน้า',
    image: '/pics/Screenshot_5.png',
    imageType: 'image',
    imageDuration: 5000,
  },
  {
    text: 'Students have class leaderboard and earn XP and titles for completed tests',
    textThai: 'นักเรียนมีตารางคะแนนชั้นเรียนและได้รับ XP และตำแหน่งสำหรับการทดสอบที่เสร็จสมบูรณ์',
    image: '/pics/Screenshot_6.png',
    imageType: 'image',
    imageDuration: 5000,
  },
  {
    text: "Teachers can also track student's progress",
    textThai: 'ครูสามารถติดตามความก้าวหน้าของนักเรียนได้เช่นกัน',
    image: '/pics/Screenshot_7.png',
    imageType: 'image',
    imageDuration: 5000,
  },
  {
    text: 'Teachers can also see class average score and adjust the program if needed',
    textThai: 'ครูสามารถดูคะแนนเฉลี่ยของชั้นเรียนและปรับโปรแกรมหากจำเป็น',
    image: '/pics/Screenshot_8.png',
    imageType: 'image',
    imageDuration: 5000,
  },
  {
    text: 'We hope we will meet you next year',
    textThai: 'เราหวังว่าจะได้พบคุณในปีหน้า',
  },
  {
    text: 'Best wishes from Mathayomwatsing EP',
    textThai: 'ขอแสดงความนับถือจาก Mathayomwatsing EP',
    image: '/pics/presentation/Final.jpg',
    imageType: 'image',
    imageDuration: 3000,
  },
]

