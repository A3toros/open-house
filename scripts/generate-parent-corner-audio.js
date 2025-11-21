import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import fetch from 'node-fetch'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

if (!OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY environment variable is required')
  process.exit(1)
}

const articles = [
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
  },
]

const audioDir = path.join(__dirname, '..', 'public', 'audio', 'parent-corner')

// Ensure directory exists
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true })
}

async function generateAudio(articleId, language, text, voice) {
  const filename = `${articleId}-${language}.mp3`
  const filepath = path.join(audioDir, filename)

  // Skip if file already exists
  if (fs.existsSync(filepath)) {
    console.log(`✓ ${filename} already exists, skipping...`)
    return filepath
  }

  console.log(`Generating ${filename}...`)

  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: voice,
        response_format: 'mp3',
        speed: 1.0,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`TTS API error: ${errorText}`)
    }

    const buffer = await response.arrayBuffer()
    fs.writeFileSync(filepath, Buffer.from(buffer))
    console.log(`✓ Generated ${filename}`)
    return filepath
  } catch (error) {
    console.error(`✗ Failed to generate ${filename}:`, error.message)
    throw error
  }
}

async function generateAllAudio() {
  console.log('Starting audio generation for Parent Corner articles...\n')

  for (const article of articles) {
    // Generate English audio
    const englishText = `${article.title.en}. ${article.summary.en}. ${article.content.en.join(' ')}`
    await generateAudio(article.id, 'en', englishText, 'nova')
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Generate Thai audio
    const thaiText = `${article.title.th}. ${article.summary.th}. ${article.content.th.join(' ')}`
    await generateAudio(article.id, 'th', thaiText, 'alloy')
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log('\n✓ All audio files generated successfully!')
  console.log(`Files saved to: ${audioDir}`)
}

generateAllAudio().catch(error => {
  console.error('Error generating audio:', error)
  process.exit(1)
})

