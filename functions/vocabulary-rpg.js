const { ok, badRequest, serverError } = require('./response')
const { getSql, logEvent } = require('./db')
const { randomUUID } = require('crypto')

// Normal level vocabulary list (~150 easy words for 10-year-old ESL kids)
const VOCABULARY_LIST_NORMAL = [
  { word: 'brave', definition: 'Not afraid; the opposite of scared.' },
  { word: 'tiny', definition: 'Very small; similar to little.' },
  { word: 'shout', definition: 'To speak very loudly; the opposite of whisper.' },
  { word: 'quick', definition: 'Fast; the opposite of slow.' },
  { word: 'freeze', definition: 'To become very cold or turn into ice.' },
  { word: 'gentle', definition: 'Soft and careful; the opposite of rough.' },
  { word: 'share', definition: 'To give part of something to someone.' },
  { word: 'calm', definition: 'Quiet and relaxed; the opposite of nervous.' },
  { word: 'polite', definition: 'Nice in the way you speak to people; similar to kind.' },
  { word: 'hungry', definition: 'Needing food; the opposite of full.' },
  { word: 'patient', definition: 'Able to wait without getting angry.' },
  { word: 'lazy', definition: 'Not wanting to work; the opposite of hard-working.' },
  { word: 'protect', definition: 'To keep someone or something safe.' },
  { word: 'repair', definition: 'To fix something broken.' },
  { word: 'smart', definition: 'Very clever; good at learning.' },
  { word: 'whisper', definition: 'To speak very softly; the opposite of shout.' },
  { word: 'recycle', definition: 'Use old things to make new things.' },
  { word: 'respect', definition: 'To treat someone well; the opposite of disrespect.' },
  { word: 'arrange', definition: 'To put things in order; similar to organize.' },
  { word: 'discover', definition: 'To find something new.' },
  { word: 'happy', definition: 'Feeling good and smiling.' },
  { word: 'confident', definition: 'Sure of yourself; the opposite of shy.' },
  { word: 'useful', definition: 'Helpful; the opposite of useless.' },
  { word: 'normal', definition: 'Regular; not special.' },
  { word: 'famous', definition: 'Known by many people.' },
  { word: 'crowded', definition: 'Full of people; the opposite of empty.' },
  { word: 'old', definition: 'Not new; from a long time ago.' },
  { word: 'new', definition: 'Just made; not old.' },
  { word: 'silent', definition: 'No sound; the opposite of noisy.' },
  { word: 'comfortable', definition: 'Feels nice and soft; the opposite of uncomfortable.' },
  { word: 'wild', definition: 'Not tame; like animals in the forest.' },
  { word: 'tasty', definition: 'Very good to eat; similar to delicious.' },
  { word: 'imagine', definition: 'To picture something in your mind.' },
  { word: 'collect', definition: 'To gather things together.' },
  { word: 'borrow', definition: 'To take something for a short time.' },
  { word: 'lend', definition: 'To give something to someone for a short time.' },
  { word: 'complain', definition: 'To say you are unhappy about something.' },
  { word: 'promise', definition: 'To say you will do something.' },
  { word: 'encourage', definition: 'To make someone feel brave or strong.' },
  { word: 'adventure', definition: 'An exciting trip or experience.' },
  { word: 'journey', definition: 'Traveling from one place to another.' },
  { word: 'guess', definition: 'To try to answer when you are not sure.' },
  { word: 'improve', definition: 'To make something better.' },
  { word: 'erase', definition: 'To remove writing or marks.' },
  { word: 'careful', definition: 'Paying attention; opposite of careless.' },
  { word: 'dangerous', definition: 'Not safe; opposite of safe.' },
  { word: 'celebrate', definition: 'To enjoy a special day with others.' },
  { word: 'explain', definition: 'To make something easy to understand.' },
  { word: 'choose', definition: 'To pick something.' },
  { word: 'build', definition: 'To make something using materials.' },
  { word: 'break', definition: 'To make something into pieces.' },
  { word: 'escape', definition: 'To get away from danger.' },
  { word: 'compare', definition: 'To look at how things are the same or different.' },
  { word: 'trust', definition: 'To believe someone is honest.' },
  { word: 'solve', definition: 'To find the answer to a problem.' },
  { word: 'suggest', definition: 'To give an idea.' },
  { word: 'strange', definition: 'Not normal; similar to weird.' },
  { word: 'busy', definition: 'Doing many things; opposite of free.' },
  { word: 'scared', definition: 'Feeling afraid.' },
  { word: 'healthy', definition: 'Good for your body; opposite of unhealthy.' },
  { word: 'empty', definition: 'With nothing inside; opposite of full.' },
  { word: 'deep', definition: 'Going far down; opposite of shallow.' },
  { word: 'bright', definition: 'Full of light; opposite of dark.' },
  { word: 'awake', definition: 'Not sleeping; opposite of asleep.' },
  { word: 'lucky', definition: 'Having good things happen.' },
  { word: 'unlucky', definition: 'Having bad things happen.' },
  { word: 'warm', definition: 'A little hot; opposite of cold.' },
  { word: 'proud', definition: 'Happy about something you did.' },
  { word: 'curious', definition: 'Wanting to know more.' },
  { word: 'huge', definition: 'Very big; opposite of tiny.' },
  { word: 'fair', definition: 'Equal and kind; opposite of unfair.' },
  { word: 'peaceful', definition: 'Quiet and calm.' },
  { word: 'loud', definition: 'Making a big sound; opposite of quiet.' },
  { word: 'friend', definition: 'A person you like and play with.' },
  { word: 'leader', definition: 'A person who shows people what to do.' },
  { word: 'artist', definition: 'A person who makes pictures or art.' },
  { word: 'teacher', definition: 'A person who helps you learn.' },
  { word: 'visitor', definition: 'A person who comes to your home or school.' },
  { word: 'winner', definition: 'A person who comes first.' },
  { word: 'loser', definition: 'A person who does not win.' },
  { word: 'hero', definition: 'A person who does brave things.' },
  { word: 'bad', definition: 'Not good; opposite of good.' },
  { word: 'captain', definition: 'The leader of a team or ship.' },
  { word: 'airport', definition: 'A place where planes take off and land.' },
  { word: 'library', definition: 'A place where you borrow books.' },
  { word: 'bakery', definition: 'A place where bread and cakes are made.' },
  { word: 'hospital', definition: 'A place where sick people get help.' },
  { word: 'farm', definition: 'A place where animals and crops are raised.' },
  { word: 'museum', definition: 'A place where old or special things are shown.' },
  { word: 'factory', definition: 'A place where things are made.' },
  { word: 'classroom', definition: 'A place where students learn.' },
  { word: 'playground', definition: 'A place where children play.' },
  { word: 'planet', definition: 'A large round object in space.' },
  { word: 'good', definition: 'Nice or excellent; opposite of bad.' },
  { word: 'sad', definition: 'Feeling unhappy; opposite of happy.' },
  { word: 'angry', definition: 'Feeling mad or upset.' },
  { word: 'tired', definition: 'Needing rest or sleep.' },
  { word: 'excited', definition: 'Feeling very happy and energetic.' },
  { word: 'worried', definition: 'Feeling nervous about something.' },
  { word: 'surprised', definition: 'Feeling shocked or amazed.' },
  { word: 'clean', definition: 'Not dirty; opposite of dirty.' },
  { word: 'dirty', definition: 'Not clean; has dirt on it.' },
  { word: 'wet', definition: 'Covered with water; opposite of dry.' },
  { word: 'dry', definition: 'Not wet; opposite of wet.' },
  { word: 'hot', definition: 'Very warm; opposite of cold.' },
  { word: 'cold', definition: 'Not warm; opposite of hot.' },
  { word: 'soft', definition: 'Easy to press; opposite of hard.' },
  { word: 'hard', definition: 'Difficult to break; opposite of soft.' },
  { word: 'heavy', definition: 'Weighs a lot; opposite of light.' },
  { word: 'light', definition: 'Not heavy; easy to carry.' },
  { word: 'slow', definition: 'Not fast; opposite of quick.' },
  { word: 'big', definition: 'Large in size; opposite of small.' },
  { word: 'small', definition: 'Little in size; opposite of big.' },
  { word: 'long', definition: 'Not short; goes far.' },
  { word: 'short', definition: 'Not long; small distance.' },
  { word: 'high', definition: 'Far above the ground; opposite of low.' },
  { word: 'low', definition: 'Close to the ground; opposite of high.' },
  { word: 'wide', definition: 'Broad; opposite of narrow.' },
  { word: 'narrow', definition: 'Not wide; thin.' },
  { word: 'thick', definition: 'Not thin; opposite of thin.' },
  { word: 'thin', definition: 'Not thick; opposite of thick.' },
  { word: 'round', definition: 'Shaped like a circle or ball.' },
  { word: 'square', definition: 'Shaped with four equal sides.' },
  { word: 'sweet', definition: 'Tastes like sugar; opposite of sour.' },
  { word: 'sour', definition: 'Tastes like lemon; opposite of sweet.' },
  { word: 'salty', definition: 'Tastes like salt.' },
  { word: 'bitter', definition: 'Tastes bad, like coffee without sugar.' },
  { word: 'fresh', definition: 'New and clean; not old.' },
  { word: 'stale', definition: 'Old and not fresh anymore.' },
  { word: 'smooth', definition: 'Not rough; easy to touch.' },
  { word: 'rough', definition: 'Not smooth; feels bumpy.' },
  { word: 'sharp', definition: 'Can cut things; opposite of dull.' },
  { word: 'dull', definition: 'Not sharp; cannot cut well.' },
  { word: 'strong', definition: 'Very powerful; opposite of weak.' },
  { word: 'weak', definition: 'Not strong; opposite of strong.' },
  { word: 'rich', definition: 'Has a lot of money; opposite of poor.' },
  { word: 'poor', definition: 'Has little money; opposite of rich.' },
  { word: 'young', definition: 'Not old; a child or teenager.' },
  { word: 'sick', definition: 'Not healthy; feeling ill.' },
  { word: 'well', definition: 'Healthy; not sick.' },
  { word: 'tall', definition: 'High in height; opposite of short.' },
  { word: 'fat', definition: 'Has a lot of weight; opposite of thin.' },
  { word: 'skinny', definition: 'Very thin; not fat.' },
  { word: 'beautiful', definition: 'Very pretty; nice to look at.' },
  { word: 'ugly', definition: 'Not pretty; opposite of beautiful.' },
  { word: 'pretty', definition: 'Nice to look at; similar to beautiful.' },
  { word: 'handsome', definition: 'Good-looking; usually for boys or men.' },
  { word: 'funny', definition: 'Makes you laugh; humorous.' },
  { word: 'serious', definition: 'Not funny; very important.' },
  { word: 'kind', definition: 'Nice and helpful to others.' },
  { word: 'mean', definition: 'Not nice; unkind to others.' },
  { word: 'honest', definition: 'Tells the truth; opposite of dishonest.' },
  { word: 'dishonest', definition: 'Does not tell the truth; lies.' },
  { word: 'generous', definition: 'Likes to give things to others.' },
  { word: 'selfish', definition: 'Only thinks about themselves.' },
  { word: 'shy', definition: 'Afraid to talk to new people.' },
  { word: 'outgoing', definition: 'Likes to talk and meet new people.' },
  { word: 'active', definition: 'Likes to move and do things.' },
  { word: 'quiet', definition: 'Makes little noise; opposite of loud.' },
  { word: 'noisy', definition: 'Makes a lot of sound; opposite of quiet.' },
  { word: 'messy', definition: 'Not tidy; things are everywhere.' },
  { word: 'tidy', definition: 'Clean and organized; opposite of messy.' },
  { word: 'neat', definition: 'Clean and organized; similar to tidy.' },
  { word: 'organized', definition: 'Everything is in the right place.' },
  { word: 'disorganized', definition: 'Things are not in order.' },
  { word: 'careful', definition: 'Pays attention; tries not to make mistakes.' },
  { word: 'careless', definition: 'Does not pay attention; makes mistakes.' },
  { word: 'responsible', definition: 'Can be trusted to do things right.' },
  { word: 'irresponsible', definition: 'Cannot be trusted; does not do things right.' },
  { word: 'mature', definition: 'Acts like an adult; not childish.' },
  { word: 'immature', definition: 'Acts like a child; not grown up.' },
  { word: 'independent', definition: 'Can do things alone; does not need help.' },
  { word: 'dependent', definition: 'Needs help from others; cannot do alone.' },
  { word: 'creative', definition: 'Good at making new things or ideas.' },
  { word: 'logical', definition: 'Uses reason and facts to think.' },
  { word: 'emotional', definition: 'Shows feelings easily.' },
  { word: 'calm', definition: 'Peaceful and relaxed; not nervous.' },
  { word: 'nervous', definition: 'Feeling worried or scared.' },
  { word: 'relaxed', definition: 'Feeling calm and comfortable.' },
  { word: 'stressed', definition: 'Feeling worried and pressured.' },
  { word: 'energetic', definition: 'Has a lot of energy; very active.' },
  { word: 'lazy', definition: 'Does not want to work or move.' },
  { word: 'motivated', definition: 'Wants to work hard and succeed.' },
  { word: 'unmotivated', definition: 'Does not want to work or try.' },
  { word: 'focused', definition: 'Pays attention to one thing.' },
  { word: 'distracted', definition: 'Cannot pay attention; mind wanders.' },
  { word: 'determined', definition: 'Will not give up; keeps trying.' },
  { word: 'persistent', definition: 'Keeps trying even when it is hard.' },
  { word: 'flexible', definition: 'Can change easily; not rigid.' },
  { word: 'rigid', definition: 'Cannot change; very strict.' },
  { word: 'adaptable', definition: 'Can adjust to new situations.' },
  { word: 'stubborn', definition: 'Will not change their mind easily.' },
  { word: 'open-minded', definition: 'Willing to listen to new ideas.' },
  { word: 'closed-minded', definition: 'Not willing to listen to new ideas.' },
  { word: 'optimistic', definition: 'Thinks good things will happen.' },
  { word: 'pessimistic', definition: 'Thinks bad things will happen.' },
  { word: 'realistic', definition: 'Sees things as they really are.' },
  { word: 'random', definition: 'No pattern or order.' },
  { word: 'reliable', definition: 'Can be trusted; always does what they say.' },
  { word: 'late', definition: 'Arrives after the expected time.' },
  { word: 'early', definition: 'Arrives before the expected time.' },
  { word: 'simple', definition: 'Easy to understand; not complicated.' },
  { word: 'complicated', definition: 'Hard to understand; has many parts.' },
  { word: 'clear', definition: 'Easy to understand; obvious.' },
  { word: 'unclear', definition: 'Hard to understand; not obvious.' },
  { word: 'obvious', definition: 'Easy to see or understand.' },
  { word: 'direct', definition: 'Straightforward; clear.' },
  { word: 'specific', definition: 'Exact and detailed; not general.' },
  { word: 'general', definition: 'Not specific; broad and vague.' },
  { word: 'accurate', definition: 'Correct; no mistakes.' },
  { word: 'inaccurate', definition: 'Not correct; has mistakes.' },
  { word: 'exact', definition: 'Completely correct; precise.' },
  { word: 'brief', definition: 'Short; not long.' },
  { word: 'incomplete', definition: 'Not finished; missing parts.' },
  { word: 'entire', definition: 'Complete; whole thing.' },
  { word: 'whole', definition: 'All of something; complete.' },
  { word: 'multiple', definition: 'More than one; many.' },
  { word: 'single', definition: 'Only one; not multiple.' },
  { word: 'individual', definition: 'One person or thing; single.' },
  { word: 'collective', definition: 'All together; group.' },
  { word: 'common', definition: 'Happens often; usual.' },
  { word: 'uncommon', definition: 'Does not happen often; rare.' },
  { word: 'rare', definition: 'Not common; hard to find.' },
  { word: 'frequent', definition: 'Happens often; common.' },
  { word: 'infrequent', definition: 'Does not happen often; rare.' },
  { word: 'regular', definition: 'Happens often and on schedule.' },
  { word: 'irregular', definition: 'Does not happen on schedule; unpredictable.' },
  { word: 'consistent', definition: 'Always the same; regular.' },
  { word: 'inconsistent', definition: 'Changes; not regular.' },
  { word: 'stable', definition: 'Does not change; steady.' },
  { word: 'unstable', definition: 'Changes often; not steady.' },
  { word: 'steady', definition: 'Does not change; stable.' },
  { word: 'unsteady', definition: 'Shakes or moves; not stable.' },
  { word: 'constant', definition: 'Always the same; never changes.' },
  { word: 'variable', definition: 'Changes; not constant.' },
  { word: 'fixed', definition: 'Does not change; set.' },
  { word: 'flexible', definition: 'Can change; not fixed.' },
  { word: 'permanent', definition: 'Lasts forever; does not change.' },
  { word: 'temporary', definition: 'Only for a short time; not permanent.' },
  { word: 'eternal', definition: 'Lasts forever; never ends.' },
  { word: 'finite', definition: 'Has an end; not infinite.' },
  { word: 'infinite', definition: 'Never ends; goes on forever.' },
  { word: 'limited', definition: 'Has a limit; not unlimited.' },
  { word: 'unlimited', definition: 'No limit; can go on forever.' },
  { word: 'restricted', definition: 'Has rules or limits.' },
  { word: 'unrestricted', definition: 'No rules or limits.' },
  { word: 'bound', definition: 'Limited; cannot go beyond.' },
  { word: 'unbound', definition: 'Not limited; free.' },
  { word: 'free', definition: 'Not limited; can do anything.' },
  { word: 'confined', definition: 'Limited to a small space.' },
  { word: 'unconfined', definition: 'Not limited; free to move.' },
  { word: 'open', definition: 'Not closed; accessible.' },
  { word: 'closed', definition: 'Not open; shut.' },
  { word: 'accessible', definition: 'Easy to reach or use.' },
  { word: 'inaccessible', definition: 'Hard to reach or use.' },
  { word: 'available', definition: 'Can be used or gotten.' },
  { word: 'unavailable', definition: 'Cannot be used or gotten.' },
  { word: 'obtainable', definition: 'Can be gotten; available.' },
  { word: 'unobtainable', definition: 'Cannot be gotten; unavailable.' },
  { word: 'attainable', definition: 'Can be achieved; possible.' },
  { word: 'unattainable', definition: 'Cannot be achieved; impossible.' },
  { word: 'possible', definition: 'Can happen; not impossible.' },
  { word: 'impossible', definition: 'Cannot happen; not possible.' },
  { word: 'feasible', definition: 'Can be done; possible.' },
  { word: 'infeasible', definition: 'Cannot be done; impossible.' },
  { word: 'practical', definition: 'Can be done in real life; realistic.' },
  { word: 'impractical', definition: 'Cannot be done in real life; unrealistic.' },
  { word: 'realistic', definition: 'Based on reality; practical.' },
  { word: 'unrealistic', definition: 'Not based on reality; impractical.' },
  { word: 'achievable', definition: 'Can be done; possible.' },
  { word: 'unachievable', definition: 'Cannot be done; impossible.' },
  { word: 'attainable', definition: 'Can be reached; achievable.' },
  { word: 'unattainable', definition: 'Cannot be reached; unachievable.' },
  { word: 'reachable', definition: 'Can be reached; attainable.' },
  { word: 'unreachable', definition: 'Cannot be reached; unattainable.' },
  { word: 'accessible', definition: 'Easy to reach; reachable.' },
  { word: 'inaccessible', definition: 'Hard to reach; unreachable.' },
  { word: 'approachable', definition: 'Easy to talk to; friendly.' },
  { word: 'unapproachable', definition: 'Hard to talk to; unfriendly.' },
  { word: 'friendly', definition: 'Nice and kind; easy to talk to.' },
  { word: 'unfriendly', definition: 'Not nice; hard to talk to.' },
  { word: 'welcoming', definition: 'Makes you feel comfortable; friendly.' },
  { word: 'unwelcoming', definition: 'Makes you feel uncomfortable; unfriendly.' },
  { word: 'hospitable', definition: 'Welcomes guests; friendly.' },
  { word: 'inhospitable', definition: 'Does not welcome guests; unfriendly.' },
  { word: 'cordial', definition: 'Polite and friendly; warm.' },
  { word: 'cold', definition: 'Not friendly; unfriendly.' },
  { word: 'warm', definition: 'Friendly and kind; cordial.' },
  { word: 'cool', definition: 'Not very friendly; somewhat cold.' },
  { word: 'distant', definition: 'Not close; far away or unfriendly.' },
  { word: 'close', definition: 'Near; not far away or very friendly.' },
  { word: 'intimate', definition: 'Very close; personal and private.' },
  { word: 'distant', definition: 'Not close; far away or not friendly.' },
  { word: 'remote', definition: 'Far away; distant.' },
  { word: 'nearby', definition: 'Close; not far away.' },
  { word: 'adjacent', definition: 'Next to; very close.' },
  { word: 'distant', definition: 'Far away; not close.' },
  { word: 'proximate', definition: 'Very close; nearby.' },
  { word: 'distant', definition: 'Far away; not proximate.' },
  { word: 'immediate', definition: 'Right now; without delay.' },
  { word: 'delayed', definition: 'Happens later; not immediate.' },
  { word: 'instant', definition: 'Happens right away; immediate.' },
  { word: 'gradual', definition: 'Happens slowly over time; not instant.' },
  { word: 'sudden', definition: 'Happens quickly; not gradual.' },
  { word: 'abrupt', definition: 'Happens suddenly; not gradual.' },
  { word: 'gradual', definition: 'Happens slowly; not abrupt.' },
  { word: 'progressive', definition: 'Happens step by step; gradual.' },
  { word: 'regressive', definition: 'Goes backwards; not progressive.' },
  { word: 'forward', definition: 'Moving ahead; progressive.' },
  { word: 'backward', definition: 'Moving behind; regressive.' },
  { word: 'advanced', definition: 'Ahead of others; forward.' },
  { word: 'backward', definition: 'Behind others; not advanced.' },
  { word: 'primitive', definition: 'Very old and simple; not advanced.' },
  { word: 'sophisticated', definition: 'Complex and advanced; not primitive.' },
  { word: 'refined', definition: 'Improved and polished; sophisticated.' },
  { word: 'crude', definition: 'Rough and unpolished; not refined.' },
  { word: 'polished', definition: 'Smooth and refined; not crude.' },
  { word: 'rough', definition: 'Not smooth; crude.' },
  { word: 'smooth', definition: 'Not rough; polished.' },
  { word: 'coarse', definition: 'Rough texture; not smooth.' },
  { word: 'fine', definition: 'Smooth texture; not coarse.' },
  { word: 'delicate', definition: 'Easily broken; needs careful handling.' },
  { word: 'sturdy', definition: 'Strong and hard to break; not delicate.' },
  { word: 'fragile', definition: 'Easily broken; delicate.' },
  { word: 'robust', definition: 'Strong and sturdy; not fragile.' },
  { word: 'durable', definition: 'Lasts a long time; robust.' },
  { word: 'perishable', definition: 'Goes bad quickly; not durable.' },
  { word: 'stable', definition: 'Does not break easily; durable.' },
  { word: 'unstable', definition: 'Breaks easily; not durable.' },
  { word: 'secure', definition: 'Safe and protected; stable.' },
  { word: 'insecure', definition: 'Not safe; unstable.' },
  { word: 'safe', definition: 'Not dangerous; secure.' },
  { word: 'dangerous', definition: 'Not safe; risky.' },
  { word: 'risky', definition: 'Has danger; not safe.' },
  { word: 'hazardous', definition: 'Very dangerous; risky.' },
  { word: 'harmless', definition: 'Not dangerous; safe.' },
  { word: 'harmful', definition: 'Can cause damage; dangerous.' },
  { word: 'beneficial', definition: 'Good for you; helpful.' },
  { word: 'detrimental', definition: 'Bad for you; harmful.' },
  { word: 'advantageous', definition: 'Gives an advantage; beneficial.' },
  { word: 'disadvantageous', definition: 'Gives a disadvantage; detrimental.' },
  { word: 'favorable', definition: 'Good; advantageous.' },
  { word: 'unfavorable', definition: 'Bad; disadvantageous.' },
  { word: 'positive', definition: 'Good; favorable.' },
  { word: 'negative', definition: 'Bad; unfavorable.' },
  { word: 'constructive', definition: 'Helps build something; positive.' },
  { word: 'destructive', definition: 'Breaks things; negative.' },
  { word: 'productive', definition: 'Creates things; constructive.' },
  { word: 'counterproductive', definition: 'Works against goals; destructive.' },
  { word: 'efficient', definition: 'Works well; productive.' },
  { word: 'inefficient', definition: 'Does not work well; counterproductive.' },
  { word: 'effective', definition: 'Gets results; efficient.' },
  { word: 'ineffective', definition: 'Does not get results; inefficient.' },
  { word: 'successful', definition: 'Achieves goals; effective.' },
  { word: 'unsuccessful', definition: 'Does not achieve goals; ineffective.' },
  { word: 'fruitful', definition: 'Produces results; successful.' },
  { word: 'fruitless', definition: 'Produces no results; unsuccessful.' },
  { word: 'rewarding', definition: 'Gives satisfaction; fruitful.' },
  { word: 'unrewarding', definition: 'Gives no satisfaction; fruitless.' },
  { word: 'satisfying', definition: 'Feels good; rewarding.' },
  { word: 'unsatisfying', definition: 'Does not feel good; unrewarding.' },
  { word: 'fulfilling', definition: 'Makes you feel complete; satisfying.' },
  { word: 'unfulfilling', definition: 'Does not make you feel complete; unsatisfying.' },
  { word: 'gratifying', definition: 'Pleases you; fulfilling.' },
  { word: 'ungratifying', definition: 'Does not please you; unfulfilling.' },
  { word: 'pleasing', definition: 'Makes you happy; gratifying.' },
  { word: 'displeasing', definition: 'Makes you unhappy; ungratifying.' },
  { word: 'pleasant', definition: 'Nice; pleasing.' },
  { word: 'unpleasant', definition: 'Not nice; displeasing.' },
  { word: 'agreeable', definition: 'Nice to be around; pleasant.' },
  { word: 'disagreeable', definition: 'Not nice to be around; unpleasant.' },
  { word: 'enjoyable', definition: 'Fun; pleasant.' },
  { word: 'unenjoyable', definition: 'Not fun; unpleasant.' },
  { word: 'entertaining', definition: 'Fun to watch or do; enjoyable.' },
  { word: 'boring', definition: 'Not fun; unenjoyable.' },
  { word: 'interesting', definition: 'Makes you want to know more; entertaining.' },
  { word: 'uninteresting', definition: 'Does not make you want to know more; boring.' },
  { word: 'tidy', definition: 'Clean and organized.' },
  { word: 'untidy', definition: 'Not clean; disorganized.' },
  { word: 'neat', definition: 'Clean and tidy.' },
  { word: 'messy', definition: 'Not neat; untidy.' },
  { word: 'clean', definition: 'Not dirty; neat.' },
  { word: 'dirty', definition: 'Not clean; messy.' },
  { word: 'perfect', definition: 'No mistakes; very good.' },
  { word: 'imperfect', definition: 'Has mistakes; not perfect.' },
  { word: 'correct', definition: 'Right; not wrong.' },
  { word: 'incorrect', definition: 'Wrong; not right.' },
  { word: 'right', definition: 'Correct; not wrong.' },
  { word: 'wrong', definition: 'Incorrect; not right.' },
  { word: 'true', definition: 'Correct; right.' },
  { word: 'false', definition: 'Incorrect; wrong.' },
  { word: 'legal', definition: 'Allowed by law.' },
  { word: 'illegal', definition: 'Not allowed by law.' },
  { word: 'typical', definition: 'Normal and expected.' },
  { word: 'ordinary', definition: 'Normal; typical.' },
  { word: 'common', definition: 'Happens often; usual.' },
  { word: 'uncommon', definition: 'Does not happen often; rare.' },
  { word: 'rare', definition: 'Not common; hard to find.' },
  { word: 'frequent', definition: 'Happens often; common.' },
  { word: 'regular', definition: 'Happens often and on schedule.' },
  { word: 'irregular', definition: 'Does not happen on schedule.' },
  { word: 'stable', definition: 'Does not change; steady.' },
  { word: 'unstable', definition: 'Changes often; not steady.' },
  { word: 'steady', definition: 'Does not change; stable.' },
  { word: 'constant', definition: 'Always the same; never changes.' },
  { word: 'fixed', definition: 'Does not change; set.' },
  { word: 'flexible', definition: 'Can change; not fixed.' },
  { word: 'permanent', definition: 'Lasts forever; does not change.' },
  { word: 'temporary', definition: 'Only for a short time; not permanent.' },
  { word: 'limited', definition: 'Has a limit; not unlimited.' },
  { word: 'unlimited', definition: 'No limit; can go on forever.' },
  { word: 'free', definition: 'Not limited; can do anything.' },
  { word: 'open', definition: 'Not closed; accessible.' },
  { word: 'closed', definition: 'Not open; shut.' },
  { word: 'available', definition: 'Can be used or gotten.' },
  { word: 'unavailable', definition: 'Cannot be used or gotten.' },
  { word: 'possible', definition: 'Can happen; not impossible.' },
  { word: 'impossible', definition: 'Cannot happen; not possible.' },
  { word: 'friendly', definition: 'Nice and kind; easy to talk to.' },
  { word: 'unfriendly', definition: 'Not nice; hard to talk to.' },
  { word: 'warm', definition: 'Friendly and kind.' },
  { word: 'cool', definition: 'Not very friendly.' },
  { word: 'close', definition: 'Near; not far away.' },
  { word: 'nearby', definition: 'Close; not far away.' },
  { word: 'sudden', definition: 'Happens quickly; not gradual.' },
  { word: 'smooth', definition: 'Not rough; easy to touch.' },
  { word: 'rough', definition: 'Not smooth; feels bumpy.' },
  { word: 'safe', definition: 'Not dangerous; secure.' },
  { word: 'dangerous', definition: 'Not safe; risky.' },
  { word: 'risky', definition: 'Has danger; not safe.' },
  { word: 'harmless', definition: 'Not dangerous; safe.' },
  { word: 'harmful', definition: 'Can cause damage; dangerous.' },
  { word: 'positive', definition: 'Good; favorable.' },
  { word: 'negative', definition: 'Bad; unfavorable.' },
  { word: 'successful', definition: 'Achieves goals; effective.' },
  { word: 'unsuccessful', definition: 'Does not achieve goals; ineffective.' },
  { word: 'pleasant', definition: 'Nice; pleasing.' },
  { word: 'unpleasant', definition: 'Not nice; displeasing.' },
  { word: 'enjoyable', definition: 'Fun; pleasant.' },
  { word: 'boring', definition: 'Not fun; unenjoyable.' },
  { word: 'interesting', definition: 'Makes you want to know more.' },
  { word: 'uninteresting', definition: 'Does not make you want to know more; boring.' },
  { word: 'important', definition: 'Matters a lot; significant.' },
  { word: 'unimportant', definition: 'Does not matter much.' },
]

// Difficult level vocabulary list (~100 challenging words for advanced ESL students)
const VOCABULARY_LIST_DIFFICULT = [
  { word: 'brilliant', definition: 'Exceptionally intelligent or talented; extremely bright.' },
  { word: 'moody', definition: 'Having unpredictable changes in mood or temperament.' },
  { word: 'ancient', definition: 'Belonging to a very distant past; extremely old.' },
  { word: 'sophisticated', definition: 'Complex, refined, or advanced in character.' },
  { word: 'predict', definition: 'To forecast or foretell a future event or outcome.' },
  { word: 'destroy', definition: 'To completely ruin or demolish something.' },
  { word: 'frightened', definition: 'Feeling extreme fear or terror.' },
  { word: 'neighbour', definition: 'A person living near or next to another.' },
  { word: 'inventor', definition: 'A person who creates or devises new things or methods.' },
  { word: 'villain', definition: 'A character in a story who opposes the hero; an evil person.' },
  { word: 'theoretical', definition: 'Based on theory rather than practical experience.' },
  { word: 'analytical', definition: 'Relating to or using analysis or logical reasoning.' },
  { word: 'intuitive', definition: 'Based on feeling or instinct rather than conscious reasoning.' },
  { word: 'systematic', definition: 'Done according to a fixed plan or system; methodical.' },
  { word: 'punctual', definition: 'Happening or doing something at the agreed or proper time.' },
  { word: 'competent', definition: 'Having the necessary ability, knowledge, or skill.' },
  { word: 'professional', definition: 'Relating to or connected with a profession; highly skilled.' },
  { word: 'expert', definition: 'A person who has comprehensive knowledge or skill in a particular area.' },
  { word: 'complex', definition: 'Consisting of many different and connected parts; complicated.' },
  { word: 'straightforward', definition: 'Uncomplicated and easy to understand; direct.' },
  { word: 'subtle', definition: 'So delicate or precise as to be difficult to detect or analyze.' },
  { word: 'explicit', definition: 'Stated clearly and in detail, leaving no room for confusion.' },
  { word: 'implicit', definition: 'Suggested though not directly expressed; implied.' },
  { word: 'figurative', definition: 'Using words in a non-literal way; metaphorical.' },
  { word: 'abstract', definition: 'Existing in thought or as an idea but not having a physical existence.' },
  { word: 'vague', definition: 'Unclear or imprecise in meaning or expression.' },
  { word: 'precise', definition: 'Marked by exactness and accuracy of expression or detail.' },
  { word: 'comprehensive', definition: 'Complete and including everything; thorough.' },
  { word: 'partial', definition: 'Existing only in part; incomplete.' },
  { word: 'fraction', definition: 'A numerical quantity that is not a whole number.' },
  { word: 'heterogeneous', definition: 'Diverse in character or content; varied.' },
  { word: 'homogeneous', definition: 'Of the same kind; uniform in structure or composition.' },
  { word: 'standardized', definition: 'Made to conform to a standard; uniform.' },
  { word: 'structured', definition: 'Having a well-defined organization or arrangement.' },
  { word: 'immaculate', definition: 'Perfectly clean, neat, or tidy; flawless.' },
  { word: 'pristine', definition: 'In its original condition; unspoiled.' },
  { word: 'contaminated', definition: 'Made impure by exposure to or addition of a poisonous substance.' },
  { word: 'preserved', definition: 'Maintained in its original or existing state; protected.' },
  { word: 'cultivated', definition: 'Refined and well-educated; developed through care.' },
  { word: 'nurtured', definition: 'Cared for and encouraged the growth or development of.' },
  { word: 'fostered', definition: 'Encouraged or promoted the development of something.' },
  { word: 'mature', definition: 'Fully developed physically; fully grown.' },
  { word: 'juvenile', definition: 'Relating to young people; childish or immature.' },
  { word: 'superior', definition: 'Higher in rank, status, or quality; better than others.' },
  { word: 'inferior', definition: 'Lower in rank, status, or quality; worse than others.' },
  { word: 'optimal', definition: 'Best or most favorable; ideal.' },
  { word: 'suboptimal', definition: 'Below the best possible standard or quality.' },
  { word: 'flawless', definition: 'Without any imperfections or defects; perfect.' },
  { word: 'defective', definition: 'Imperfect or faulty; not working correctly.' },
  { word: 'legitimate', definition: 'Conforming to the law or to rules; valid.' },
  { word: 'illegitimate', definition: 'Not authorized by the law; not valid.' },
  { word: 'compliant', definition: 'Inclined to agree with others or obey rules; conforming.' },
  { word: 'non-compliant', definition: 'Failing to act in accordance with rules or standards.' },
  { word: 'atypical', definition: 'Not representative of a type, group, or class; unusual.' },
  { word: 'extraordinary', definition: 'Very unusual or remarkable; exceptional.' },
  { word: 'inconsistent', definition: 'Not staying the same throughout; having contradictions.' },
  { word: 'variable', definition: 'Not consistent or having a fixed pattern; liable to change.' },
  { word: 'resilient', definition: 'Able to recover quickly from difficulties; tough.' },
  { word: 'enduring', definition: 'Lasting over a long period of time; persistent.' },
  { word: 'finite', definition: 'Having limits or bounds; not infinite.' },
  { word: 'infinite', definition: 'Limitless or endless in space, extent, or size.' },
  { word: 'restricted', definition: 'Limited in extent, number, or scope; confined.' },
  { word: 'unrestricted', definition: 'Not limited or restricted; free from limitations.' },
  { word: 'attainable', definition: 'Able to be achieved or accomplished; reachable.' },
  { word: 'unattainable', definition: 'Not able to be achieved or accomplished; unreachable.' },
  { word: 'feasible', definition: 'Possible to do easily or conveniently; practicable.' },
  { word: 'infeasible', definition: 'Not possible to do easily; impracticable.' },
  { word: 'impractical', definition: 'Not adapted for use or action; unrealistic.' },
  { word: 'unrealistic', definition: 'Not having a sensible understanding of what can be achieved.' },
  { word: 'hospitable', definition: 'Friendly and welcoming to guests or strangers.' },
  { word: 'inhospitable', definition: 'Unfriendly and unwelcoming; harsh environment.' },
  { word: 'cordial', definition: 'Warm and friendly; polite.' },
  { word: 'intimate', definition: 'Closely acquainted; familiar; private.' },
  { word: 'adjacent', definition: 'Next to or adjoining something else; neighboring.' },
  { word: 'proximate', definition: 'Very near or close in space, time, or relationship.' },
  { word: 'gradual', definition: 'Taking place or progressing slowly or by degrees.' },
  { word: 'abrupt', definition: 'Sudden and unexpected; sharp or steep.' },
  { word: 'progressive', definition: 'Happening or developing gradually or in stages.' },
  { word: 'regressive', definition: 'Returning to a former or less developed state.' },
  { word: 'primitive', definition: 'Relating to an early stage in development; basic.' },
  { word: 'refined', definition: 'Elegant and cultured in appearance, manner, or taste.' },
  { word: 'coarse', definition: 'Rough or harsh in texture; lacking refinement.' },
  { word: 'delicate', definition: 'Very fine in texture or structure; easily broken.' },
  { word: 'robust', definition: 'Strong and healthy; vigorous; sturdy.' },
  { word: 'perishable', definition: 'Likely to decay or go bad quickly; not durable.' },
  { word: 'hazardous', definition: 'Risky; dangerous; involving danger.' },
  { word: 'beneficial', definition: 'Favorable or advantageous; resulting in good.' },
  { word: 'detrimental', definition: 'Tending to cause harm; damaging.' },
  { word: 'advantageous', definition: 'Involving or creating favorable circumstances.' },
  { word: 'disadvantageous', definition: 'Involving or creating unfavorable circumstances.' },
  { word: 'constructive', definition: 'Having a positive effect; helpful.' },
  { word: 'destructive', definition: 'Causing great and irreparable damage or harm.' },
  { word: 'counterproductive', definition: 'Having the opposite of the desired effect.' },
  { word: 'fruitful', definition: 'Producing good or helpful results; productive.' },
  { word: 'fruitless', definition: 'Failing to achieve the desired results; unproductive.' },
  { word: 'gratifying', definition: 'Giving pleasure or satisfaction; pleasing.' },
  { word: 'ungratifying', definition: 'Not giving pleasure or satisfaction; disappointing.' },
  { word: 'fulfilling', definition: 'Making someone satisfied or happy through their achievements.' },
  { word: 'unfulfilling', definition: 'Not providing satisfaction or a sense of achievement.' },
  { word: 'agreeable', definition: 'Pleasant or pleasing; willing to agree.' },
  { word: 'disagreeable', definition: 'Unpleasant or unlikable; causing annoyance.' },
  { word: 'engaging', definition: 'Charming and attractive; holding attention.' },
  { word: 'tedious', definition: 'Too long, slow, or dull; tiresome or monotonous.' },
  { word: 'monotonous', definition: 'Dull, tedious, and repetitious; lacking in variety.' },
  { word: 'diverse', definition: 'Showing a great deal of variety; very different.' },
]

// Helper function to get vocabulary list based on difficulty
const getVocabularyList = (difficulty = 'normal') => {
  return difficulty === 'difficult' ? VOCABULARY_LIST_DIFFICULT : VOCABULARY_LIST_NORMAL
}

// In-memory storage for game sessions (which words have been used)
const gameSessions = new Map()

// Shuffle array function
const shuffleArray = (array) => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok()
  if (event.httpMethod !== 'POST') return badRequest('Use POST')

  try {
    const body = JSON.parse(event.body || '{}')
    const { action, sessionId = null, runId, answer, gameSessionId, difficulty = 'normal' } = body
    const sql = getSql()

    // Get the appropriate vocabulary list based on difficulty
    const VOCABULARY_LIST = getVocabularyList(difficulty)

    // Generate a single card from pre-defined list
    const generateCard = async (usedIndices = [], vocabList = VOCABULARY_LIST) => {
      // Get available words (not yet used in this session)
      let availableWords = vocabList.filter((_, index) => !usedIndices.includes(index))
      
      if (availableWords.length === 0) {
        // All words used, reset and use all words
        usedIndices.length = 0
        availableWords = vocabList
      }
      
      const randomIndex = Math.floor(Math.random() * availableWords.length)
      const vocab = availableWords[randomIndex]
      const originalIndex = vocabList.findIndex(v => v.word === vocab.word)
      
      const id = randomUUID()
      const level = difficulty === 'difficult' ? 'B2' : 'A2'
      await sql`
        INSERT INTO vocabulary_runs (id, session_id, level, definition, expected_word, correct, xp_earned)
        VALUES (${id}, ${sessionId}, ${level}, ${vocab.definition}, ${vocab.word}, false, 0)
      `

      return { runId: id, card: { definition: vocab.definition, word: vocab.word }, vocabIndex: originalIndex }
    }

    // Generate 10 cards for a game session (unique words)
    const generateBatch = async (gameSessionId, vocabList = VOCABULARY_LIST) => {
      let sessionData = gameSessions.get(gameSessionId) || { usedIndices: [], difficulty }
      let usedIndices = sessionData.usedIndices || []
      
      // Get available words (not yet used in this session)
      let availableWords = vocabList.filter((_, index) => !usedIndices.includes(index))
      
      if (availableWords.length === 0) {
        // All words used, reset and use all words
        usedIndices = []
        availableWords = vocabList
      }
      
      // Shuffle and select 10 unique words for this game
      const shuffled = shuffleArray(availableWords)
      const selected = shuffled.slice(0, Math.min(10, shuffled.length))
      
      const cards = []
      const level = difficulty === 'difficult' ? 'B2' : 'A2'
      for (const vocab of selected) {
        const originalIndex = vocabList.findIndex(v => v.word === vocab.word)
        const id = randomUUID()
        await sql`
          INSERT INTO vocabulary_runs (id, session_id, level, definition, expected_word, correct, xp_earned)
          VALUES (${id}, ${sessionId}, ${level}, ${vocab.definition}, ${vocab.word}, false, 0)
        `
        cards.push({ runId: id, card: { definition: vocab.definition, word: vocab.word } })
        
        if (!usedIndices.includes(originalIndex)) {
          usedIndices.push(originalIndex)
        }
      }
      
      // Store the game session used indices, card IDs, and difficulty
      const cardIds = cards.map(c => c.runId)
      gameSessions.set(gameSessionId, { 
        usedIndices,
        cardIds,
        difficulty
      })
      return cards
    }

    if (action === 'start-game') {
      const gameSessionId = randomUUID()
      const cards = await generateBatch(gameSessionId, VOCABULARY_LIST)
      
      await logEvent(sessionId, 'vocabulary-rpg', 'game-started', { gameSessionId, cardsCount: cards.length })

      return ok({ gameSessionId, cards })
    }

    if (action === 'get-next') {
      if (!gameSessionId) return badRequest('gameSessionId required')
      
      // Get card IDs for this game session from memory
      const gameSession = gameSessions.get(gameSessionId)
      if (!gameSession || !gameSession.cardIds || gameSession.cardIds.length === 0) {
        return badRequest('Game session not found or no cards available')
      }
      
      // Find an unused card from this game session's card IDs
      const unusedCards = await sql`
        SELECT id, definition, expected_word 
        FROM vocabulary_runs 
        WHERE id = ANY(${gameSession.cardIds})
          AND user_answer IS NULL 
          AND (correct IS NULL OR correct = false)
        ORDER BY created_at ASC
        LIMIT 1
      `

      if (unusedCards.length > 0) {
        const card = unusedCards[0]
        return ok({
          runId: card.id,
          card: { definition: card.definition, word: card.expected_word },
        })
      }

      // No more cards available for this game session
      return ok({ runId: null, card: null, gameComplete: true })
    }

    if (action === 'generate') {
      const sessionData = gameSessions.get(gameSessionId) || { usedIndices: [], difficulty: 'normal' }
      const usedIndices = sessionData.usedIndices || []
      const sessionDifficulty = sessionData.difficulty || difficulty
      const vocabList = getVocabularyList(sessionDifficulty)
      const cardData = await generateCard(usedIndices, vocabList)
      if (cardData.vocabIndex !== undefined && !usedIndices.includes(cardData.vocabIndex)) {
        usedIndices.push(cardData.vocabIndex)
        gameSessions.set(gameSessionId, { ...sessionData, usedIndices })
      }
      await logEvent(sessionId, 'vocabulary-rpg', 'card-generated', { runId: cardData.runId })
      return ok({ runId: cardData.runId, card: cardData.card })
    }

    // Trim articles (a, an, the) from answers
    const trimArticles = (text) => {
      return text
        .trim()
        .toLowerCase()
        .replace(/^(a|an|the)\s+/i, '')
        .trim()
    }

    // Flexible answer matching - checks if answer contains the correct word or root
    const matchAnswer = (userAnswer, correctAnswer) => {
      // Normalize spaces - replace multiple spaces with single space, remove leading/trailing
      const normalizeSpaces = (text) => text.replace(/\s+/g, ' ').trim()
      
      const user = normalizeSpaces(trimArticles(userAnswer).toLowerCase())
      const correct = normalizeSpaces(trimArticles(correctAnswer).toLowerCase())
      
      // Exact match
      if (user === correct) return true
      
      // Remove spaces for comparison (handles "ice cream" vs "icecream")
      const userNoSpaces = user.replace(/\s+/g, '')
      const correctNoSpaces = correct.replace(/\s+/g, '')
      if (userNoSpaces === correctNoSpaces) return true
      
      // Check if user answer contains the correct word
      if (user.includes(correct) || correct.includes(user)) return true
      
      // Check root words (simple approach: check if one word is contained in the other)
      // For example: "refrigerator" matches "fridge", "freeze" matches "freezing"
      const userWords = user.split(/\s+/)
      const correctWords = correct.split(/\s+/)
      
      // Check if any word from user answer matches any word from correct answer
      for (const userWord of userWords) {
        for (const correctWord of correctWords) {
          // Check if words share a common root (at least 4 characters match)
          const minLength = Math.min(userWord.length, correctWord.length)
          if (minLength >= 4) {
            // Check if one word starts with the other (for root matching)
            if (userWord.startsWith(correctWord.substring(0, Math.min(4, correctWord.length))) ||
                correctWord.startsWith(userWord.substring(0, Math.min(4, userWord.length)))) {
              return true
            }
            // Check if they share a significant portion
            if (userWord.length >= 4 && correctWord.length >= 4) {
              const userRoot = userWord.substring(0, Math.min(5, userWord.length))
              const correctRoot = correctWord.substring(0, Math.min(5, correctWord.length))
              if (userRoot === correctRoot) return true
            }
          }
          // For shorter words, allow exact match only
          if (userWord === correctWord) return true
        }
      }
      
      return false
    }

    if (action === 'answer') {
      if (!runId || !answer) return badRequest('runId and answer required')
      const rows = await sql`
        SELECT expected_word FROM vocabulary_runs WHERE id = ${runId}
      `
      if (rows.length === 0) return badRequest('Run not found')

      const correct = matchAnswer(answer, rows[0].expected_word)
      const xpEarned = correct ? 10 : 0

      await sql`
        UPDATE vocabulary_runs
        SET user_answer = ${answer}, correct = ${correct}, xp_earned = ${xpEarned}
        WHERE id = ${runId}
      `

      await logEvent(sessionId, 'vocabulary-rpg', 'answer-submitted', { runId, correct })

      return ok({ 
        correct, 
        xpEarned,
        correctWord: rows[0].expected_word
      })
    }

    return badRequest('Unsupported action')
  } catch (error) {
    console.error('vocabulary-rpg error', error)
    return serverError('Vocabulary RPG failed', error.message)
  }
}

