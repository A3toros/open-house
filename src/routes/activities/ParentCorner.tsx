import { useState, useRef, useCallback, useEffect } from 'react'
import { ActivityLayout } from '../ActivityLayout'
import { motion, AnimatePresence } from 'framer-motion'
import { useBilingualText } from '../../hooks/useBilingualText'
import { useSession } from '../../contexts/SessionContext'
import { apiClient } from '../../services/apiClient'

type Article = {
  id: string
  title: {
    en: string
    th: string
  }
  summary: {
    en: string
    th: string
  }
  content: {
    en: string[]
    th: string[]
  }
  imageUrl: string
  category: 'benefits' | 'safety' | 'tools' | 'future'
}

const articles: Article[] = [
  {
    id: 'ai-personalized-learning',
    title: {
      en: 'Personalized Learning: How AI Adapts to Your Child',
      th: 'การเรียนรู้แบบเฉพาะบุคคล: AI ปรับให้เหมาะกับลูกของคุณอย่างไร',
    },
    summary: {
      en: 'AI analyzes your child\'s learning patterns and creates customized educational experiences that match their unique needs and pace.',
      th: 'AI วิเคราะห์รูปแบบการเรียนรู้ของลูกคุณและสร้างประสบการณ์ทางการศึกษาที่ปรับแต่งให้เหมาะกับความต้องการและจังหวะการเรียนรู้เฉพาะตัว',
    },
    content: {
      en: [
        'Artificial Intelligence is revolutionizing education by creating personalized learning experiences for each student. Unlike traditional one-size-fits-all approaches, AI-powered systems analyze how your child learns, identifies their strengths and weaknesses, and adapts content accordingly.',
        'For example, if your child struggles with math concepts, AI can provide additional practice problems and visual explanations. If they excel in reading, the system can introduce more challenging texts. This personalized approach helps students learn at their own pace, reducing frustration and building confidence.',
        'Research shows that personalized learning can improve student engagement by up to 40% and help students achieve better academic outcomes. AI makes this possible by continuously monitoring progress and adjusting the learning path in real-time.',
      ],
      th: [
        'ปัญญาประดิษฐ์กำลังปฏิวัติการศึกษาด้วยการสร้างประสบการณ์การเรียนรู้แบบเฉพาะบุคคลสำหรับนักเรียนแต่ละคน ไม่เหมือนกับวิธีการแบบเดิมที่ใช้กับทุกคน ระบบที่ขับเคลื่อนด้วย AI วิเคราะห์ว่าลูกของคุณเรียนรู้อย่างไร ระบุจุดแข็งและจุดอ่อน และปรับเนื้อหาตามนั้น',
        'ตัวอย่างเช่น หากลูกของคุณมีปัญหากับแนวคิดทางคณิตศาสตร์ AI สามารถให้โจทย์ฝึกเพิ่มเติมและคำอธิบายแบบภาพได้ หากพวกเขาทำได้ดีในการอ่าน ระบบสามารถแนะนำข้อความที่ท้าทายมากขึ้นได้ วิธีการแบบเฉพาะบุคคลนี้ช่วยให้นักเรียนเรียนรู้ตามจังหวะของตนเอง ลดความหงุดหงิดและสร้างความมั่นใจ',
        'การวิจัยแสดงให้เห็นว่าการเรียนรู้แบบเฉพาะบุคคลสามารถเพิ่มการมีส่วนร่วมของนักเรียนได้ถึง 40% และช่วยให้นักเรียนบรรลุผลลัพธ์ทางวิชาการที่ดีขึ้น AI ทำให้สิ่งนี้เป็นไปได้โดยการติดตามความก้าวหน้าอย่างต่อเนื่องและปรับเส้นทางการเรียนรู้แบบเรียลไทม์',
      ],
    },
    imageUrl: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&h=600&fit=crop',
    category: 'benefits',
  },
  {
    id: 'ai-safety-privacy',
    title: {
      en: 'AI Safety & Privacy: Protecting Your Child\'s Data',
      th: 'ความปลอดภัยและความเป็นส่วนตัวของ AI: ปกป้องข้อมูลของลูกคุณ',
    },
    summary: {
      en: 'Learn how educational AI systems protect student privacy and what parents should know about data security.',
      th: 'เรียนรู้ว่าระบบ AI ทางการศึกษาปกป้องความเป็นส่วนตัวของนักเรียนอย่างไร และผู้ปกครองควรทราบอะไรเกี่ยวกับความปลอดภัยของข้อมูล',
    },
    content: {
      en: [
        'When schools use AI tools, protecting your child\'s personal information is paramount. Reputable educational AI platforms follow strict privacy regulations like COPPA (Children\'s Online Privacy Protection Act) and GDPR, ensuring that student data is collected, stored, and used responsibly.',
        'Good AI systems use data only to improve learning outcomes—never for advertising or commercial purposes. They encrypt data, limit access to authorized personnel, and allow parents to review what information is collected about their children.',
        'As a parent, you should ask schools about their data privacy policies, understand what information is collected, and ensure you have the right to access or delete your child\'s data. Transparency and communication between schools and parents are essential for building trust in AI-powered education.',
      ],
      th: [
        'เมื่อโรงเรียนใช้เครื่องมือ AI การปกป้องข้อมูลส่วนบุคคลของลูกคุณเป็นสิ่งสำคัญที่สุด แพลตฟอร์ม AI ทางการศึกษาที่มีชื่อเสียงปฏิบัติตามกฎระเบียบด้านความเป็นส่วนตัวที่เข้มงวด เช่น COPPA (กฎหมายคุ้มครองความเป็นส่วนตัวออนไลน์ของเด็ก) และ GDPR เพื่อให้แน่ใจว่าข้อมูลนักเรียนถูกรวบรวม เก็บรักษา และใช้งานอย่างมีความรับผิดชอบ',
        'ระบบ AI ที่ดีใช้ข้อมูลเพื่อปรับปรุงผลลัพธ์การเรียนรู้เท่านั้น—ไม่เคยใช้เพื่อการโฆษณาหรือวัตถุประสงค์ทางการค้า พวกเข้ารหัสข้อมูล จำกัดการเข้าถึงเฉพาะบุคลากรที่ได้รับอนุญาต และอนุญาตให้ผู้ปกครองตรวจสอบว่าข้อมูลใดถูกรวบรวมเกี่ยวกับลูกของพวกเขา',
        'ในฐานะผู้ปกครอง คุณควรสอบถามโรงเรียนเกี่ยวกับนโยบายความเป็นส่วนตัวของข้อมูล เข้าใจว่าข้อมูลใดถูกรวบรวม และให้แน่ใจว่าคุณมีสิทธิ์เข้าถึงหรือลบข้อมูลของลูกคุณ ความโปร่งใสและการสื่อสารระหว่างโรงเรียนและผู้ปกครองมีความจำเป็นสำหรับการสร้างความไว้วางใจในการศึกษาที่ขับเคลื่อนด้วย AI',
      ],
    },
    imageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop',
    category: 'safety',
  },
  {
    id: 'ai-tools-for-home',
    title: {
      en: 'AI Tools for Home Learning: A Parent\'s Guide',
      th: 'เครื่องมือ AI สำหรับการเรียนรู้ที่บ้าน: คู่มือสำหรับผู้ปกครอง',
    },
    summary: {
      en: 'Discover safe and effective AI-powered educational tools that can support your child\'s learning at home.',
      th: 'ค้นพบเครื่องมือทางการศึกษาที่ขับเคลื่อนด้วย AI ที่ปลอดภัยและมีประสิทธิภาพซึ่งสามารถสนับสนุนการเรียนรู้ของลูกคุณที่บ้าน',
    },
    content: {
      en: [
        'Many AI-powered educational tools can complement your child\'s school learning at home. These tools range from language learning apps that adapt to your child\'s pronunciation, to math tutors that provide step-by-step explanations, to reading assistants that help improve comprehension.',
        'When choosing AI tools for home use, look for platforms that are age-appropriate, have strong privacy protections, and align with your child\'s learning goals. Free tools like Khan Academy Kids and Duolingo use AI to personalize learning, while premium options offer more advanced features.',
        'Remember that AI tools should supplement, not replace, human interaction. Encourage your child to discuss what they\'re learning with you, and use AI as a tool to explore topics together. Balance screen time with hands-on activities and real-world experiences.',
      ],
      th: [
        'เครื่องมือทางการศึกษาที่ขับเคลื่อนด้วย AI หลายอย่างสามารถเสริมการเรียนรู้ของลูกคุณที่โรงเรียนที่บ้าน เครื่องมือเหล่านี้มีตั้งแต่แอปเรียนภาษาที่ปรับให้เหมาะกับการออกเสียงของลูกคุณ ไปจนถึงติวเตอร์คณิตศาสตร์ที่ให้คำอธิบายทีละขั้นตอน ไปจนถึงผู้ช่วยอ่านที่ช่วยปรับปรุงความเข้าใจ',
        'เมื่อเลือกเครื่องมือ AI สำหรับใช้ที่บ้าน ให้มองหาแพลตฟอร์มที่เหมาะสมกับอายุ มีการป้องกันความเป็นส่วนตัวที่แข็งแกร่ง และสอดคล้องกับเป้าหมายการเรียนรู้ของลูกคุณ เครื่องมือฟรีเช่น Khan Academy Kids และ Duolingo ใช้ AI เพื่อปรับการเรียนรู้ให้เป็นส่วนตัว ในขณะที่ตัวเลือกพรีเมียมมีคุณสมบัติขั้นสูงมากขึ้น',
        'จำไว้ว่าเครื่องมือ AI ควรเสริม ไม่ใช่แทนที่การโต้ตอบของมนุษย์ ส่งเสริมให้ลูกของคุณพูดคุยเกี่ยวกับสิ่งที่พวกเขากำลังเรียนรู้กับคุณ และใช้ AI เป็นเครื่องมือในการสำรวจหัวข้อร่วมกัน สร้างสมดุลระหว่างเวลาหน้าจอกับกิจกรรมเชิงปฏิบัติและประสบการณ์ในโลกแห่งความเป็นจริง',
      ],
    },
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop',
    category: 'tools',
  },
  {
    id: 'future-of-ai-education',
    title: {
      en: 'The Future of AI in Education: What to Expect',
      th: 'อนาคตของ AI ในการศึกษา: สิ่งที่คาดหวัง',
    },
    summary: {
      en: 'Explore emerging trends in AI education and how they will shape your child\'s learning journey.',
      th: 'สำรวจแนวโน้มที่เกิดขึ้นใหม่ในการศึกษา AI และวิธีที่พวกเขาจะกำหนดเส้นทางการเรียนรู้ของลูกคุณ',
    },
    content: {
      en: [
        'The future of AI in education looks promising, with new technologies emerging that will make learning more engaging, accessible, and effective. We can expect to see virtual reality classrooms, AI tutors that understand emotions, and adaptive learning systems that grow with your child.',
        'AI will also help bridge educational gaps, providing quality education to students in remote areas and supporting children with learning differences. As AI becomes more sophisticated, it will better understand individual learning styles and provide even more personalized support.',
        'However, the human element remains crucial. Teachers will continue to play a vital role in inspiring students, fostering creativity, and teaching critical thinking skills that AI cannot replicate. The future is about AI and humans working together to create the best possible learning experience.',
      ],
      th: [
        'อนาคตของ AI ในการศึกษาดูมีแนวโน้มดี โดยมีเทคโนโลยีใหม่ที่เกิดขึ้นซึ่งจะทำให้การเรียนรู้มีส่วนร่วม เข้าถึงได้ และมีประสิทธิภาพมากขึ้น เราสามารถคาดหวังว่าจะเห็นห้องเรียนเสมือนจริง ติวเตอร์ AI ที่เข้าใจอารมณ์ และระบบการเรียนรู้แบบปรับตัวที่เติบโตไปพร้อมกับลูกของคุณ',
        'AI ยังจะช่วยเชื่อมช่องว่างทางการศึกษา โดยให้การศึกษาที่มีคุณภาพแก่นักเรียนในพื้นที่ห่างไกลและสนับสนุนเด็กที่มีความแตกต่างในการเรียนรู้ เมื่อ AI มีความซับซ้อนมากขึ้น มันจะเข้าใจรูปแบบการเรียนรู้ของแต่ละบุคคลได้ดีขึ้นและให้การสนับสนุนแบบเฉพาะบุคคลมากขึ้น',
        'อย่างไรก็ตาม องค์ประกอบของมนุษย์ยังคงมีความสำคัญ ครูจะยังคงมีบทบาทสำคัญในการสร้างแรงบันดาลใจให้นักเรียน ส่งเสริมความคิดสร้างสรรค์ และสอนทักษะการคิดเชิงวิพากษ์ที่ AI ไม่สามารถทำซ้ำได้ อนาคตคือการที่ AI และมนุษย์ทำงานร่วมกันเพื่อสร้างประสบการณ์การเรียนรู้ที่ดีที่สุด',
      ],
    },
    imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=600&fit=crop',
    category: 'future',
  },
  {
    id: 'ai-critical-thinking',
    title: {
      en: 'Balancing AI Assistance with Critical Thinking',
      th: 'สร้างสมดุลระหว่างความช่วยเหลือของ AI กับการคิดเชิงวิพากษ์',
    },
    summary: {
      en: 'Learn how to help your child use AI as a learning tool while developing essential critical thinking skills.',
      th: 'เรียนรู้วิธีช่วยให้ลูกคุณใช้ AI เป็นเครื่องมือการเรียนรู้ในขณะที่พัฒนาทักษะการคิดเชิงวิพากษ์ที่จำเป็น',
    },
    content: {
      en: [
        'While AI can be a powerful learning tool, it\'s important to ensure your child develops critical thinking skills rather than becoming overly dependent on technology. Encourage your child to question AI-generated answers, verify information from multiple sources, and think independently.',
        'Teach your child that AI is a tool to help them learn, not a replacement for their own thinking. When they use AI for homework help, ask them to explain the concepts in their own words. This reinforces learning and ensures they truly understand the material.',
        'Balance is key: use AI for practice problems and explanations, but also engage in discussions, read books together, and explore topics through hands-on experiments. This combination helps develop well-rounded learners who can think critically and creatively.',
      ],
      th: [
        'ในขณะที่ AI สามารถเป็นเครื่องมือการเรียนรู้ที่มีประสิทธิภาพ แต่สิ่งสำคัญคือต้องแน่ใจว่าลูกของคุณพัฒนาทักษะการคิดเชิงวิพากษ์มากกว่าการพึ่งพาเทคโนโลยีมากเกินไป ส่งเสริมให้ลูกของคุณตั้งคำถามกับคำตอบที่สร้างโดย AI ตรวจสอบข้อมูลจากหลายแหล่ง และคิดอย่างอิสระ',
        'สอนลูกของคุณว่า AI เป็นเครื่องมือที่ช่วยให้พวกเขาเรียนรู้ ไม่ใช่การแทนที่การคิดของตนเอง เมื่อพวกเขาใช้ AI เพื่อช่วยการบ้าน ให้ถามพวกเขาให้อธิบายแนวคิดด้วยคำพูดของตนเอง สิ่งนี้เสริมการเรียนรู้และให้แน่ใจว่าพวกเขาเข้าใจเนื้อหาจริงๆ',
        'ความสมดุลเป็นสิ่งสำคัญ: ใช้ AI สำหรับโจทย์ฝึกและคำอธิบาย แต่ยังมีส่วนร่วมในการอภิปราย อ่านหนังสือร่วมกัน และสำรวจหัวข้อผ่านการทดลองเชิงปฏิบัติ การรวมกันนี้ช่วยพัฒนาผู้เรียนที่รอบด้านซึ่งสามารถคิดเชิงวิพากษ์และสร้างสรรค์ได้',
      ],
    },
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=600&fit=crop',
    category: 'benefits',
  },
  {
    id: 'ai-english-learning',
    title: {
      en: 'AI-Powered English Learning: Boosting Language Skills',
      th: 'การเรียนรู้ภาษาอังกฤษด้วย AI: เพิ่มทักษะภาษา',
    },
    summary: {
      en: 'Discover how AI helps children learn English more effectively through personalized practice and instant feedback.',
      th: 'ค้นพบว่า AI ช่วยให้เด็กเรียนรู้ภาษาอังกฤษได้อย่างมีประสิทธิภาพมากขึ้นผ่านการฝึกแบบเฉพาะบุคคลและการตอบกลับทันที',
    },
    content: {
      en: [
        'AI-powered language learning tools are transforming how children learn English. These systems provide personalized pronunciation practice, grammar correction, and vocabulary building that adapts to each child\'s learning pace and style.',
        'Speech recognition AI can analyze your child\'s pronunciation and provide instant feedback, helping them improve their accent and fluency. Reading comprehension tools adjust text difficulty based on your child\'s level, gradually building their skills.',
        'Many AI language apps use gamification to make learning fun, rewarding progress with points and achievements. This keeps children motivated while they practice. However, remember that real conversations with native speakers and reading real books remain essential for true language mastery.',
      ],
      th: [
        'เครื่องมือการเรียนรู้ภาษาที่ขับเคลื่อนด้วย AI กำลังเปลี่ยนแปลงวิธีที่เด็กเรียนรู้ภาษาอังกฤษ ระบบเหล่านี้ให้การฝึกการออกเสียงแบบเฉพาะบุคคล การแก้ไขไวยากรณ์ และการสร้างคำศัพท์ที่ปรับให้เหมาะกับจังหวะและสไตล์การเรียนรู้ของเด็กแต่ละคน',
        'AI การจดจำเสียงสามารถวิเคราะห์การออกเสียงของลูกคุณและให้ข้อเสนอแนะทันที ช่วยให้พวกเขาปรับปรุงสำเนียงและความคล่องแคล่ว เครื่องมือความเข้าใจในการอ่านปรับความยากของข้อความตามระดับของลูกคุณ สร้างทักษะของพวกเขาทีละน้อย',
        'แอปภาษาที่ใช้ AI หลายตัวใช้การเล่นเกมเพื่อทำให้การเรียนรู้สนุก ให้รางวัลความก้าวหน้าด้วยคะแนนและความสำเร็จ สิ่งนี้ทำให้เด็กมีแรงจูงใจในขณะที่พวกเขาฝึกฝน อย่างไรก็ตาม จำไว้ว่าการสนทนาจริงกับเจ้าของภาษาและการอ่านหนังสือจริงยังคงจำเป็นสำหรับการเชี่ยวชาญภาษาที่แท้จริง',
      ],
    },
    imageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=600&fit=crop',
    category: 'tools',
  },
]

const categories = [
  { id: 'all', label: { en: 'All Articles', th: 'บทความทั้งหมด' } },
  { id: 'benefits', label: { en: 'Benefits', th: 'ประโยชน์' } },
  { id: 'safety', label: { en: 'Safety & Privacy', th: 'ความปลอดภัยและความเป็นส่วนตัว' } },
  { id: 'tools', label: { en: 'Tools & Resources', th: 'เครื่องมือและทรัพยากร' } },
  { id: 'future', label: { en: 'Future Trends', th: 'แนวโน้มในอนาคต' } },
]

const ParentCorner = () => {
  const { renderText, locale } = useBilingualText()
  const { setLocale } = useSession()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [fullscreenArticle, setFullscreenArticle] = useState<Article | null>(null)
  const [isNarrating, setIsNarrating] = useState<boolean>(false)
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false)
  const narrationRef = useRef<SpeechSynthesisUtterance | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Get a female voice from available voices
  const getFemaleVoice = useCallback((lang: 'en' | 'th') => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null
    const availableVoices = window.speechSynthesis.getVoices()
    const langCode = lang === 'en' ? 'en' : 'th'
    
    // Try to find a female voice for the language
    const femaleVoice = availableVoices.find(
      (voice) =>
        voice.lang.startsWith(langCode) && (
          voice.name.toLowerCase().includes('female') ||
          voice.name.toLowerCase().includes('woman') ||
          voice.name.toLowerCase().includes('zira') || // Windows female voice
          voice.name.toLowerCase().includes('samantha') || // macOS female voice
          voice.name.toLowerCase().includes('karen') || // macOS female voice
          voice.name.toLowerCase().includes('susan') || // macOS female voice
          voice.name.toLowerCase().includes('victoria') || // macOS female voice
          voice.name.toLowerCase().includes('salli') || // AWS Polly female voice
          voice.name.toLowerCase().includes('joanna') || // AWS Polly female voice
          voice.name.toLowerCase().includes('kanya') || // Thai female voice
          voice.name.toLowerCase().includes('pattara') // Thai female voice
        )
    )
    return femaleVoice || availableVoices.find((v) => v.lang.startsWith(langCode)) || availableVoices[0]
  }, [])

  // Load voices when component mounts
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const loadVoices = () => {
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.addEventListener('voiceschanged', loadVoices, { once: true })
      }
    }
    loadVoices()
  }, [])

  const stopNarration = useCallback(() => {
    // Stop browser TTS
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    narrationRef.current = null
    
    // Stop audio playback
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    
    setIsNarrating(false)
    setIsLoadingAudio(false)
  }, [])

  const handleNarration = useCallback(async (article: Article) => {
    if (!article) return
    
    // If already narrating, stop it
    if (isNarrating) {
      stopNarration()
      return
    }

    // Stop any ongoing narration
    stopNarration()

    // Determine language based on current locale
    const currentLang = locale === 'th' ? 'th' : 'en'
    
    // Get the text to narrate
    const textToNarrate = currentLang === 'en' 
      ? `${article.title.en}. ${article.summary.en}. ${article.content.en.join(' ')}`
      : `${article.title.th}. ${article.summary.th}. ${article.content.th.join(' ')}`

    // For English, use browser TTS
    if (currentLang === 'en') {
      if (typeof window === 'undefined' || !window.speechSynthesis) return
      
      const utterance = new SpeechSynthesisUtterance(textToNarrate)
      utterance.lang = 'en-US'
      
      // Set female voice
      const femaleVoice = getFemaleVoice('en')
      if (femaleVoice) {
        utterance.voice = femaleVoice
      }
      
      utterance.rate = 0.9
      utterance.pitch = 1.0
      utterance.volume = 1.0
      
      utterance.onend = () => {
        narrationRef.current = null
        setIsNarrating(false)
      }
      
      utterance.onerror = () => {
        narrationRef.current = null
        setIsNarrating(false)
      }
      
      narrationRef.current = utterance
      setIsNarrating(true)
      window.speechSynthesis.speak(utterance)
    } else {
      // For Thai, use API TTS
      setIsLoadingAudio(true)
      try {
        const response = await apiClient.post<{ audioUrl: string; success: boolean }>('/thai-tts', {
          text: textToNarrate,
          language: 'th',
        })

        if (response.success && response.audioUrl) {
          const audio = new Audio(response.audioUrl)
          audioRef.current = audio
          
          audio.onended = () => {
            audioRef.current = null
            setIsNarrating(false)
            setIsLoadingAudio(false)
          }
          
          audio.onerror = () => {
            audioRef.current = null
            setIsNarrating(false)
            setIsLoadingAudio(false)
          }
          
          setIsNarrating(true)
          setIsLoadingAudio(false)
          await audio.play()
        } else {
          setIsLoadingAudio(false)
          console.error('TTS API returned unsuccessful response')
        }
      } catch (error) {
        console.error('TTS API error:', error)
        setIsLoadingAudio(false)
        // Fallback to browser TTS even for Thai (may not work well)
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance(textToNarrate)
          utterance.lang = 'th-TH'
          const femaleVoice = getFemaleVoice('th')
          if (femaleVoice) {
            utterance.voice = femaleVoice
          }
          utterance.rate = 0.9
          utterance.pitch = 1.0
          utterance.volume = 1.0
          utterance.onend = () => setIsNarrating(false)
          utterance.onerror = () => setIsNarrating(false)
          narrationRef.current = utterance
          setIsNarrating(true)
          window.speechSynthesis.speak(utterance)
        }
      }
    }
  }, [isNarrating, locale, getFemaleVoice, stopNarration])

  const filteredArticles = selectedCategory === 'all' 
    ? articles 
    : articles.filter(article => article.category === selectedCategory)

  const setLanguage = (lang: 'en' | 'th' | 'bilingual') => {
    setLocale(lang)
  }

  return (
    <>
      {/* Language Buttons - Fixed position top right */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => setLanguage('th')}
          className={`rounded-xl border-2 px-4 py-2 text-sm font-semibold transition ${
            locale === 'th'
              ? 'border-[#11E0FF] bg-[#11E0FF]/20 text-[#11E0FF] shadow-[0_0_15px_rgba(17,224,255,0.4)]'
              : 'border-[#11E0FF]/30 bg-[#1E2A49]/50 text-white/70 hover:border-[#11E0FF]/60 hover:bg-[#1E2A49]'
          }`}
          style={locale === 'th' ? { textShadow: '0 0 6px rgba(17, 224, 255, 0.5)' } : {}}
        >
          TH
        </button>
        <button
          onClick={() => setLanguage('en')}
          className={`rounded-xl border-2 px-4 py-2 text-sm font-semibold transition ${
            locale === 'en'
              ? 'border-[#11E0FF] bg-[#11E0FF]/20 text-[#11E0FF] shadow-[0_0_15px_rgba(17,224,255,0.4)]'
              : 'border-[#11E0FF]/30 bg-[#1E2A49]/50 text-white/70 hover:border-[#11E0FF]/60 hover:bg-[#1E2A49]'
          }`}
          style={locale === 'en' ? { textShadow: '0 0 6px rgba(17, 224, 255, 0.5)' } : {}}
        >
          EN
        </button>
      </div>

      <ActivityLayout 
        title={renderText({ en: 'Parent Corner', th: 'มุมผู้ปกครอง' })}
        subtitle={renderText({ 
          en: 'Expert articles on AI in education, safety tips, and learning resources for parents.',
          th: 'บทความผู้เชี่ยวชาญเกี่ยวกับ AI ในการศึกษา เคล็ดลับความปลอดภัย และทรัพยากรการเรียนรู้สำหรับผู้ปกครอง'
        })}
      >
        <div className="space-y-6 rounded-3xl border border-[#11E0FF]/30 bg-[#1E2A49] p-6">

        {/* Category Filter */}
        <div className="flex flex-wrap gap-3 border-b border-[#11E0FF]/20 pb-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`rounded-full border-2 px-4 py-2 text-sm font-semibold transition ${
                selectedCategory === category.id
                  ? 'border-[#11E0FF] bg-[#11E0FF]/20 text-[#11E0FF] shadow-[0_0_15px_rgba(17,224,255,0.4)]'
                  : 'border-[#11E0FF]/30 bg-[#1E2A49]/50 text-white/70 hover:border-[#11E0FF]/60 hover:bg-[#1E2A49]'
              }`}
              style={selectedCategory === category.id ? { textShadow: '0 0 6px rgba(17, 224, 255, 0.6)' } : {}}
            >
              {renderText(category.label)}
            </button>
          ))}
        </div>

        {/* Articles Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          <AnimatePresence mode="wait">
            {filteredArticles.map((article, index) => (
              <motion.article
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="group cursor-pointer rounded-2xl border border-[#11E0FF]/20 bg-[#1C2340] overflow-hidden transition-all hover:border-[#11E0FF]/40 hover:shadow-[0_0_20px_rgba(17,224,255,0.2)]"
                onClick={() => setFullscreenArticle(article)}
              >
                {/* Article Image */}
                <div className="relative h-48 w-full overflow-hidden bg-[#1E2A49]">
                  <img
                    src={article.imageUrl}
                    alt={renderText(article.title)}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => {
                      // Fallback if image fails to load
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1C2340] via-transparent to-transparent" />
                </div>

                {/* Article Content */}
                <div className="p-6">
                  <h3 className="mb-2 font-display text-xl font-bold text-white transition-colors">
                    {locale === 'bilingual' ? (
                      <>
                        <div className="mb-1">{article.title.en}</div>
                        <div className="text-base text-white/80">{article.title.th}</div>
                      </>
                    ) : (
                      renderText(article.title)
                    )}
                  </h3>

                  <p className="mb-4 text-sm text-white/70">
                    {locale === 'bilingual' ? (
                      <>
                        <div className="mb-2">{article.summary.en}</div>
                        <div>{article.summary.th}</div>
                      </>
                    ) : (
                      renderText(article.summary)
                    )}
                  </p>

                  {/* Read More Indicator */}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-[#11E0FF]">
                      {renderText({ en: 'Click to read full article', th: 'คลิกเพื่ออ่านบทความเต็ม' })}
                    </span>
                    <span className="text-[#11E0FF]">→</span>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredArticles.length === 0 && (
          <div className="rounded-2xl border border-[#11E0FF]/20 bg-[#1C2340] p-8 text-center">
            <p className="text-white/70">
              {renderText({ 
                en: 'No articles found in this category.',
                th: 'ไม่พบบทความในหมวดหมู่นี้'
              })}
            </p>
          </div>
        )}
      </div>
    </ActivityLayout>

      {/* Fullscreen Article Modal */}
      <AnimatePresence>
        {fullscreenArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
            onClick={() => {
              stopNarration()
              setFullscreenArticle(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                stopNarration()
                setFullscreenArticle(null)
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-[#11E0FF]/30 bg-[#1C2340] p-8 shadow-[0_0_50px_rgba(17,224,255,0.3)]"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  stopNarration()
                  setFullscreenArticle(null)
                }}
                className="absolute top-4 right-4 rounded-full border-2 border-[#11E0FF]/50 bg-[#1E2A49] p-2 text-[#11E0FF] transition hover:border-[#11E0FF] hover:bg-[#11E0FF]/20"
              >
                ✕
              </button>

              {/* Article Image */}
              <div className="mb-6 h-64 w-full overflow-hidden rounded-2xl bg-[#1E2A49]">
                <img
                  src={fullscreenArticle.imageUrl}
                  alt={renderText(fullscreenArticle.title)}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>

              {/* Article Title */}
              <h2 className="mb-4 font-display text-3xl font-bold text-white">
                {locale === 'bilingual' ? (
                  <>
                    <div className="mb-2">{fullscreenArticle.title.en}</div>
                    <div className="text-2xl text-white/80">{fullscreenArticle.title.th}</div>
                  </>
                ) : (
                  renderText(fullscreenArticle.title)
                )}
              </h2>

              {/* Narration Button */}
              <div className="mb-6">
                <button
                  onClick={() => handleNarration(fullscreenArticle)}
                  disabled={isLoadingAudio}
                  className={`flex items-center gap-2 rounded-xl border-2 px-6 py-3 text-sm font-semibold transition ${
                    isNarrating
                      ? 'border-[#FFB743] bg-[#FFB743]/20 text-[#FFB743]'
                      : 'border-[#11E0FF]/50 bg-[#11E0FF]/10 text-[#11E0FF] hover:border-[#11E0FF] hover:bg-[#11E0FF]/20'
                  } ${isLoadingAudio ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoadingAudio ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      {renderText({ en: 'Loading audio...', th: 'กำลังโหลดเสียง...' })}
                    </>
                  ) : isNarrating ? (
                    <>
                      ⏸️ {renderText({ en: 'Pause', th: 'หยุด' })}
                    </>
                  ) : (
                    <>
                      🔊 {renderText({ en: 'Listen', th: 'ฟัง' })}
                    </>
                  )}
                </button>
              </div>

              {/* Article Summary */}
              <p className="mb-6 text-lg text-white/80">
                {locale === 'bilingual' ? (
                  <>
                    <div className="mb-2">{fullscreenArticle.summary.en}</div>
                    <div>{fullscreenArticle.summary.th}</div>
                  </>
                ) : (
                  renderText(fullscreenArticle.summary)
                )}
              </p>

              {/* Article Content */}
              <div className="space-y-4 border-t border-[#11E0FF]/20 pt-6">
                {locale === 'bilingual' ? (
                  <>
                    {fullscreenArticle.content.en.map((paragraph, idx) => (
                      <div key={`en-${idx}`} className="space-y-2">
                        <p className="text-base leading-relaxed text-white/90">{paragraph}</p>
                        {fullscreenArticle.content.th[idx] && (
                          <p className="text-base leading-relaxed text-white/70 italic">{fullscreenArticle.content.th[idx]}</p>
                        )}
                      </div>
                    ))}
                  </>
                ) : (
                  fullscreenArticle.content[locale === 'th' ? 'th' : 'en'].map((paragraph, idx) => (
                    <p key={idx} className="text-base leading-relaxed text-white/90">
                      {paragraph}
                    </p>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default ParentCorner
