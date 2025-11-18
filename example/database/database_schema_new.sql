
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    grade INTEGER NOT NULL,
    class INTEGER NOT NULL,
    number INTEGER NOT NULL,
    student_id VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    -- student_id is already unique, no additional constraint needed
);


CREATE TABLE academic_year (
    id SERIAL PRIMARY KEY,
    academic_year VARCHAR(20) NOT NULL,
    semester INTEGER NOT NULL,
    term INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE teachers (
    teacher_id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE admin (
    username VARCHAR(50) PRIMARY KEY,
    password VARCHAR(100) NOT NULL
);


CREATE TABLE subjects (
    subject_id SERIAL PRIMARY KEY,
    subject VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE teacher_subjects (
    id SERIAL PRIMARY KEY,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    grade INTEGER NOT NULL,
    class INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE multiple_choice_tests (
    id SERIAL PRIMARY KEY,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    test_name VARCHAR(200) NOT NULL,
    num_questions INTEGER NOT NULL,
    num_options INTEGER NOT NULL,
    passing_score INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE true_false_tests (
    id SERIAL PRIMARY KEY,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    test_name VARCHAR(200) NOT NULL,
    num_questions INTEGER NOT NULL,
    passing_score INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE input_tests (
    id SERIAL PRIMARY KEY,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    test_name VARCHAR(200) NOT NULL,
    num_questions INTEGER NOT NULL,
    passing_score INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE test_assignments (
    id SERIAL PRIMARY KEY,
    test_type VARCHAR(20) NOT NULL,
    test_id INTEGER NOT NULL,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    grade INTEGER NOT NULL,
    class INTEGER NOT NULL,
    subject_id INTEGER REFERENCES subjects(subject_id),
    academic_period_id INTEGER REFERENCES academic_year(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE multiple_choice_test_questions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES multiple_choice_tests(id),
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    question_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    correct_answer VARCHAR(1) NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT,
    option_d TEXT,
    option_e TEXT,
    option_f TEXT
);


CREATE TABLE true_false_test_questions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES true_false_tests(id),
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    question_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    correct_answer BOOLEAN NOT NULL
);


CREATE TABLE input_test_questions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES input_tests(id),
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    question_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    correct_answers TEXT[]
);


CREATE TABLE multiple_choice_test_results (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES multiple_choice_tests(id),
    test_name VARCHAR(200) NOT NULL,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    grade INTEGER NOT NULL,
    class INTEGER NOT NULL,
    number INTEGER NOT NULL,
    student_id VARCHAR(10) REFERENCES users(student_id),
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    percentage DECIMAL(5,2) GENERATED ALWAYS AS (ROUND((score::DECIMAL / max_score::DECIMAL) * 100, 2)) STORED,
    answers JSONB NOT NULL,
    time_taken INTEGER, -- in seconds
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    caught_cheating BOOLEAN DEFAULT false,
    visibility_change_times INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    academic_period_id INTEGER REFERENCES academic_year(id)
);


CREATE TABLE true_false_test_results (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES true_false_tests(id),
    test_name VARCHAR(200) NOT NULL,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    grade INTEGER NOT NULL,
    class INTEGER NOT NULL,
    number INTEGER NOT NULL,
    student_id VARCHAR(10) REFERENCES users(student_id),
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    percentage DECIMAL(5,2) GENERATED ALWAYS AS (ROUND((score::DECIMAL / max_score::DECIMAL) * 100, 2)) STORED,
    answers JSONB NOT NULL,
    time_taken INTEGER, -- in seconds
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    caught_cheating BOOLEAN DEFAULT false,
    visibility_change_times INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    academic_period_id INTEGER REFERENCES academic_year(id)
);


CREATE TABLE input_test_results (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES input_tests(id),
    test_name VARCHAR(200) NOT NULL,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    grade INTEGER NOT NULL,
    class INTEGER NOT NULL,
    number INTEGER NOT NULL,
    student_id VARCHAR(10) REFERENCES users(student_id),
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    percentage DECIMAL(5,2) GENERATED ALWAYS AS (ROUND((score::DECIMAL / max_score::DECIMAL) * 100, 2)) STORED,
    answers JSONB NOT NULL,
    time_taken INTEGER, -- in seconds
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    caught_cheating BOOLEAN DEFAULT false,
    visibility_change_times INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    academic_period_id INTEGER REFERENCES academic_year(id)
);

-- New Matching Type Test Tables
CREATE TABLE matching_type_tests (
    id SERIAL PRIMARY KEY,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    test_name VARCHAR(200) NOT NULL,
    image_url TEXT NOT NULL,
    num_blocks INTEGER NOT NULL,
    passing_score INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE matching_type_test_questions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES matching_type_tests(id),
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    question_id INTEGER NOT NULL,
    word TEXT NOT NULL,
    block_coordinates JSONB NOT NULL,
    has_arrow BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the ENHANCED arrows table with responsive coordinate system
CREATE TABLE matching_type_test_arrows (
    id SERIAL PRIMARY KEY,
    question_id INTEGER NOT NULL REFERENCES matching_type_test_questions(id) ON DELETE CASCADE,
    
    -- ABSOLUTE coordinates (for backward compatibility)
    start_x DECIMAL(10,4) NOT NULL,  -- Changed from INTEGER to DECIMAL for precision
    start_y DECIMAL(10,4) NOT NULL,  -- Changed from INTEGER to DECIMAL for precision
    end_x DECIMAL(10,4) NOT NULL,    -- Changed from INTEGER to DECIMAL for precision
    end_y DECIMAL(10,4) NOT NULL,    -- Changed from INTEGER to DECIMAL for precision
    
    -- RELATIVE coordinates (for responsive positioning) - NEW!
    rel_start_x DECIMAL(10,4), -- Percentage from left edge (0-100)
    rel_start_y DECIMAL(10,4), -- Percentage from top edge (0-100)
    rel_end_x DECIMAL(10,4),   -- Percentage from left edge (0-100)
    rel_end_y DECIMAL(10,4),   -- Percentage from top edge (0-100)
    
    -- IMAGE dimensions (for accurate scaling) - NEW!
    image_width INTEGER,  -- Original image width when test was created
    image_height INTEGER, -- Original image height when test was created
    
    -- Arrow styling (enhanced)
    arrow_style JSONB DEFAULT '{}',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for performance
CREATE INDEX idx_matching_type_test_arrows_question_id ON matching_type_test_arrows(question_id);

CREATE TABLE matching_type_test_results (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES matching_type_tests(id),
    test_name VARCHAR(200) NOT NULL,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    grade INTEGER NOT NULL,
    class INTEGER NOT NULL,
    number INTEGER NOT NULL,
    student_id VARCHAR(10) REFERENCES users(student_id),
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    percentage DECIMAL(5,2) GENERATED ALWAYS AS (ROUND((score::DECIMAL / max_score::DECIMAL) * 100, 2)) STORED,
    answers JSONB NOT NULL,
    time_taken INTEGER, -- in seconds
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    caught_cheating BOOLEAN DEFAULT false,
    visibility_change_times INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    academic_period_id INTEGER REFERENCES academic_year(id)
);



INSERT INTO users (grade, class, number, student_id, name, surname, nickname, password) VALUES

(1, 15, 1, '51706', 'Kittikhun', 'Siriwadtanakojaroen', 'Tong Tong', '51706'),
(1, 15, 2, '51707', 'Jittiphat', 'Suksamai', 'Idea', '51707'),
(1, 15, 3, '51708', 'Jiraphon', 'Sawanakasem', 'Tun', '51708'),
(1, 15, 4, '51709', 'Nattawat', 'Prakobpanich', 'Pupha', '51709'),
(1, 15, 5, '51710', 'Thanawat', 'Pungsati', 'Sprite', '51710'),
(1, 15, 6, '51711', 'Bawonchai', 'Udomkhongmangmee', 'Sea', '51711'),
(1, 15, 7, '51712', 'Pichaya', 'Chansate', 'Chirew', '51712'),
(1, 15, 8, '51713', 'Kamonchat', 'Amornphongmongkol', 'Rose', '51713'),
(1, 15, 9, '51714', 'Chanyanuch', 'Houyhuan', 'Tonhom', '51714'),
(1, 15, 10, '51715', 'Napat', 'Mongkolwatcharoen', 'Bruda', '51715'),
(1, 15, 11, '51716', 'Thanyaluk', 'Ueasiyaphan', 'Luck', '51716'),
(1, 15, 12, '51717', 'Nicha', 'Jailak', 'Jewelry', '51717'),
(1, 15, 13, '51718', 'Neeraphan', 'Tangpaopong', 'Nee', '51718'),
(1, 15, 14, '51719', 'Phonnapphan', 'Settheepokha', 'Khaning', '51719'),
(1, 15, 15, '51720', 'Patsorn', 'Jenkatkan', 'Éclair', '51720'),
(1, 15, 16, '51721', 'Ploypaphat', 'Kittiwittayarom', 'Baifern', '51721'),
(1, 15, 17, '51722', 'Wanvisa', 'Ratsamichai', 'Tus', '51722'),
(1, 15, 18, '51723', 'Wipaporn', 'Muangsan', 'Winnie', '51723'),
(1, 15, 19, '51724', 'Sasiwannaporn', 'Likitbannasak', 'Mei', '51724'),
(1, 15, 20, '51725', 'Sarisa', 'Bhoosudsawaeng', 'Thien', '51725'),
(1, 15, 21, '51726', 'Akanit', 'Kampimabouth', 'Meili', '51726'),
(1, 15, 22, '51727', 'Uracha', 'Maolee', 'Khaohom', '51727'),
(1, 15, 23, '51728', 'Aticia', 'Kesornsung', 'Pangko', '51728'),
(1, 16, 1, '51729', 'Kamonlaphop', 'Prasertchroenphol', 'Pukan', '51729'),
(1, 16, 2, '51730', 'Jumpon', 'Onlamul', 'Yoshi', '51730'),
(1, 16, 3, '51731', 'Chinnapat', 'Prabthong', 'Title', '51731'),
(1, 16, 4, '51732', 'Naphat', 'Yuadyan', 'Khaopun', '51732'),
(1, 16, 5, '51733', 'Thanadol', 'Rakchanachai', 'austin', '51733'),
(1, 16, 6, '51734', 'Thanatbodee', 'Hongwiset', 'Inkyu', '51734'),
(1, 16, 7, '51735', 'Thitiwat', 'Srisaard', 'CC', '51735'),
(1, 16, 8, '51736', 'Noppakrun', 'Kruaisawat', 'Nene', '51736'),
(1, 16, 9, '51737', 'Nawin', 'Pongputtipak', 'Cino', '51737'),
(1, 16, 10, '51738', 'Woradej', 'Boonto', 'August', '51738'),
(1, 16, 11, '51739', 'Ongsa', 'Assanee', 'Ongsa', '51739'),
(1, 16, 12, '51740', 'Chanyanas', 'Surawuthinak', 'Kaimook', '51740'),
(1, 16, 13, '51741', 'Napattika', 'Imyaem', 'Elfie', '51741'),
(1, 16, 14, '51742', 'Natthanun', 'Kunkhomit', 'Senior', '51742'),
(1, 16, 15, '51743', 'Thepteeramumin', 'Boontarmteeraputi', 'Anda', '51743'),
(1, 16, 16, '51744', 'Piyakarn', 'Kittisiriphan', 'Smile', '51744'),
(1, 16, 17, '51745', 'Pobporn', 'Intarasorn', 'Ploy', '51745'),
(1, 16, 18, '51747', 'Pitthayapat', 'Srithanakitwetin', 'Kwan Khao', '51747'),
(1, 16, 19, '51748', 'Piriyapond', 'Kittimaensuriya', 'Dream', '51748'),
(1, 16, 20, '51750', 'Atiporn', 'Promduang', 'Pream', '51750'),


(2, 15, 1, '51007', 'Kittikhun', 'Rungsuk', 'Captain', '51007'),
(2, 15, 2, '51008', 'Kongpop', 'Samanah', 'Cartoon', '51008'),
(2, 15, 3, '51009', 'Natin', 'Ngaeprom', 'Boss', '51009'),
(2, 15, 4, '51010', 'Thammadej', 'Dejharn', 'Dej', '51010'),
(2, 15, 5, '51011', 'Bhumipat', 'Tiranasawad', 'Zen', '51011'),
(2, 15, 6, '51012', 'Yotprasu', 'Yongprayoon', 'Harit', '51012'),
(2, 15, 7, '51013', 'Winson', 'Chakhong', 'Winson', '51013'),
(2, 15, 8, '51014', 'Piriyakorn', 'Soontornkumphonrat', 'First', '51014'),
(2, 15, 9, '51015', 'Surathat', 'Fongnaree', 'Auto', '51015'),
(2, 15, 10, '51016', 'Thanadej', 'Pichairat', 'Tonplam', '51016'),
(2, 15, 11, '51017', 'Nattawat', 'Boonpitsit', 'Bright', '51017'),
(2, 15, 12, '51881', 'Thepteeramungkorn', 'Boomthantiraput', 'Loma', '51881'),
(2, 15, 13, '51018', 'Kanyanat', 'Saksakunkailerd', 'Bua', '51018'),
(2, 15, 14, '51019', 'Kakanang', 'Boonlua', 'Nana', '51019'),
(2, 15, 15, '51020', 'Nattanicha', 'Ruento', 'Maprang', '51020'),
(2, 15, 16, '51021', 'Danaya', 'Saiwanna', 'North', '51021'),
(2, 15, 17, '51022', 'Thannatsaorn', 'Anthipkul', 'Seiya', '51022'),
(2, 15, 18, '51023', 'Thanuchmon', 'Suwiratwitayakit', 'E''clair', '51023'),
(2, 15, 19, '51024', 'Thunchanok', 'Klongratsakul', 'tete', '51024'),
(2, 15, 20, '51025', 'Pinyaphat', 'Supboontanakorn', 'cream', '51025'),
(2, 15, 21, '51026', 'Waran', 'Kanwan', 'Nobell', '51026'),
(2, 15, 22, '51027', 'Sukaksorn', 'Kanjanakunti', 'Viva', '51027'),
(2, 15, 23, '51028', 'Supitchaya', 'Sukjit', 'Khaohom', '51028'),
(2, 15, 24, '51029', 'Siriyapon', 'Ramunu', 'Nam', '51029'),
(2, 15, 25, '51030', 'Hathaytip', 'Sawangruttaya', 'Waenpetch', '51030'),
(2, 16, 1, '51032', 'Konakk', 'Rojanasupakul', 'Chirew', '51032'),
(2, 16, 2, '51033', 'Kishna', 'Joshi', 'Kishna', '51033'),
(2, 16, 3, '51034', 'Justin', 'Damayanti Luxameesathporn', 'Justin', '51034'),
(2, 16, 4, '51035', 'Jiraphat', 'Chamnoi', 'Pun', '51035'),
(2, 16, 5, '51036', 'Jirayu', 'Thanawiphakon', 'Pat', '51036'),
(2, 16, 6, '51037', 'Chanthawat', 'Bowonaphiwong', 'Din', '51037'),
(2, 16, 7, '51038', 'Napat', 'Uthaisang', 'Shiryu', '51038'),
(2, 16, 8, '51039', 'Thianrawit', 'Ammaranon', 'Singto', '51039'),
(2, 16, 9, '51040', 'Narawut', 'Meechaiudomdech', 'Prince', '51040'),
(2, 16, 10, '51041', 'Papangkorn', 'Teeratanatanyaboon', 'Titan', '51041'),
(2, 16, 11, '51042', 'Poptam', 'Sathongkham', 'Tim', '51042'),
(2, 16, 12, '51043', 'Marwin', 'Phandumrongkul', 'Mark', '51043'),
(2, 16, 13, '51044', 'Suwijak', 'kijrungsophun', 'Namo', '51044'),
(2, 16, 14, '51045', 'Chonlada', 'Bonthong', 'Fifa', '51045'),
(2, 16, 15, '51046', 'Nathathai', 'Sapparia', 'Chertam', '51046'),
(2, 16, 16, '51047', 'Nopchanok', 'Reenavong', 'Pam Pam', '51047'),
(2, 16, 17, '51048', 'Parita', 'Taetee', 'Namcha', '51048'),
(2, 16, 18, '51049', 'Pimpreeya', 'Paensuwam', 'Pare', '51049'),
(2, 16, 19, '51050', 'Wirunchana', 'Daungwijit', 'Focus', '51050'),
(2, 16, 20, '51051', 'Supisala', 'Chesadatas', 'Jang Jang', '51051'),
(2, 16, 21, '51052', 'Aaraya', 'Loamorrwach', 'MiMi', '51052'),
(2, 16, 22, '51053', 'Ariyan', 'Ariyan', 'Mee Mee', '51053'),
(2, 16, 23, '51152', 'Ploypaphat', 'Aphichatprasert', 'Boeing', '51152'),
(2, 16, 24, '51153', 'Yang Yang', 'Yang Yang', 'Yang Yang', '51153'),


(3, 15, 1, '50311', 'Fan', 'Shucheng', 'Michael', '50311'),
(3, 15, 2, '50312', 'Koh', 'Shirato', 'Koh', '50312'),
(3, 15, 3, '50313', 'Chalanthorn', 'Somabootr', 'Plangton', '50313'),
(3, 15, 4, '50314', 'Napat', 'Phomvongtip', 'Han', '50314'),
(3, 15, 5, '50315', 'Natthanon', 'Aungkanaworakul', 'August', '50315'),
(3, 15, 6, '50316', 'Thanatsorn', 'Wasuntranijwipa', 'Sorn', '50316'),
(3, 15, 7, '50317', 'Thannathorn', 'Keaw-on', 'Oscar', '50317'),
(3, 15, 8, '50318', 'Teeraphat', 'Kitsato', 'Peach', '50318'),
(3, 15, 9, '50319', 'Pitpibul', 'Notayos', 'Earth', '50319'),
(3, 15, 10, '50320', 'Woradet', 'Premphueam', 'Fiat', '50320'),
(3, 15, 11, '50321', 'Wiritphon', 'Niyomthai', 'Foam', '50321'),
(3, 15, 12, '50322', 'Vishnu', 'Joshi Changchamrat', 'Vishnu', '50322'),
(3, 15, 13, '51054', 'Kannawat', 'Noosap', 'Gus', '51054'),
(3, 15, 14, '51055', 'Nuttakorn', 'Klongratsakul', 'Tar', '51055'),
(3, 15, 15, '51056', 'Thitipat', 'Suknantasit', 'Ken', '51056'),
(3, 15, 16, '50324', 'Chanutchanan', 'Rachatamethachot', 'Fah', '50324'),
(3, 15, 17, '50325', 'Natpatsorn', 'Permruangtanapol', 'Aum', '50325'),
(3, 15, 18, '50326', 'Tangsima', 'Sateanpong', 'Matoom', '50326'),
(3, 15, 19, '50327', 'Nirinyanut', 'Techathanwisit', 'Ing', '50327'),
(3, 15, 20, '50328', 'Punyanuch', 'Taninpong', 'Bam', '50328'),
(3, 15, 21, '50329', 'Phatnarin', 'Suppakijchanchai', 'Pan', '50329'),
(3, 15, 22, '50330', 'Wipawat', 'Muangsan', 'Sunny', '50330'),
(3, 15, 23, '50331', 'Santamon', 'Sarakun', 'Night', '50331'),
(3, 15, 24, '50332', 'Annatch', 'Sithchaisurakool', 'Annatch', '50332'),
(3, 16, 1, '50333', 'Zin Myint', 'Mo Lin', 'Phat', '50333'),
(3, 16, 2, '50334', 'Kantapon', 'Chinudomporn', 'Kun', '50334'),
(3, 16, 3, '50335', 'Krirkwit', 'Meeto', 'Num', '50335'),
(3, 16, 4, '50336', 'Natakorn', 'Ritthongpitak', 'Artid', '50336'),
(3, 16, 5, '50337', 'Natthanon', 'Vanichsiripatr', 'Farm', '50337'),
(3, 16, 6, '50339', 'Tanaphop', 'Bumrungrak', 'Zen', '50339'),
(3, 16, 7, '50340', 'Teerat', 'Waratpaweetorn', 'Tarhai', '50340'),
(3, 16, 8, '50341', 'Prart', 'Sirinarm', 'Skibidi', '50341'),
(3, 16, 9, '50342', 'Peethong', 'Saenkhomor', 'Prom', '50342'),
(3, 16, 10, '50343', 'Poom', 'Thongpaen', 'Poom', '50343'),
(3, 16, 11, '50344', 'Phumphat', 'Lertwannaporn', 'Phumphat', '50344'),
(3, 16, 12, '50345', 'Worakit', 'Krajangsri', 'Kit', '50345'),
(3, 16, 13, '50346', 'Sukrit', 'Dechphol', 'Franc', '50346'),
(3, 16, 14, '50347', 'Chachalee', 'Boonchuachan', 'Tripple', '50347'),
(3, 16, 15, '50348', 'Yanisa', 'Raweepipat', 'Jiffy', '50348'),
(3, 16, 16, '50349', 'Titapha', 'Yuthanom', 'Ingrak', '50349'),
(3, 16, 17, '50350', 'Nutchanun', 'Suwannahong', 'Aunpan', '50350'),
(3, 16, 18, '50351', 'Thanunchanok', 'Songrum', 'Ozon', '50351'),
(3, 16, 19, '50352', 'Pakijra', 'Panjach', 'Cake', '50352'),
(3, 16, 20, '50353', 'Phinyaphat', 'Chatthanawan', 'Tonaor', '50353'),
(3, 16, 21, '50354', 'Supichaya', 'Suppasing', 'Hana', '50354'),


(4, 13, 1, '49751', 'Sirawit', 'Antipkul', 'Data', '49751'),
(4, 13, 2, '49761', 'Koedpol', 'Angsuwiroon', 'Ti', '49761'),
(4, 13, 3, '49764', 'Nuttanapat', 'Lohakitsongkram', 'Yok', '49764'),
(4, 13, 4, '49766', 'Mattcha', 'Sirirojwong', 'Gato', '49766'),
(4, 13, 5, '51862', 'Nonprawit', 'Kampusa', 'Non', '51862'),
(4, 13, 6, '49753', 'Channuntorn', 'Ringrod', 'Praew', '49753'),
(4, 13, 7, '49758', 'Pansa', 'Hamontri', 'Aim', '49758'),
(4, 13, 8, '49759', 'Phatsalliya', 'Pakkama', 'Zen', '49759'),
(4, 13, 9, '49768', 'Kodchakon', 'Bookkaluck', 'Mint', '49768'),
(4, 13, 10, '49769', 'Jindaporn', 'Tikpmporn', 'Plai', '49769'),
(4, 13, 11, '49772', 'Papapinn', 'Thitirotjanawat', 'Ling Ling', '49772'),
(4, 13, 12, '51863', 'Natthakan', 'Panitchareon', 'Amy', '51863'),
(4, 14, 1, '49767', 'Sirasit', 'Panyasit', 'Tack', '49767'),
(4, 14, 2, '51864', 'Mr Peerapat', 'Suktapot', 'Cfo', '51864'),
(4, 14, 3, '51865', 'Wongsathorn', 'Rod-aree', 'Gui', '51865'),
(4, 14, 4, '51866', 'Suwisith', 'Tempraserteudee', 'Tonkla', '51866'),
(4, 14, 5, '49754', 'Chutikan', 'Pornvasin', 'Bebe', '49754'),
(4, 14, 6, '49773', 'Praewan', 'Taecha-in', 'Prae', '49773'),
(4, 14, 7, '51867', 'Chinapa', 'Chanumklang', 'Tar', '51867'),
(4, 14, 8, '51868', 'Larita', 'Larpverachai', 'Ching Sin', '51868'),


(5, 13, 1, '49003', 'Jaroenjit', 'Anatamsombat', 'Tek', '49003'),
(5, 13, 2, '49089', 'Chayaphon', 'Kanchitavorakul', 'Nampai', '49089'),
(5, 13, 3, '49092', 'Thananaj', 'Sawanakasem', 'Leng', '49092'),
(5, 13, 4, '49094', 'Rawipat', 'Pibalsing', 'Ryu', '49094'),
(5, 13, 5, '49095', 'Sitthas', 'Tiwatodsaporn', 'Muchty', '49095'),
(5, 13, 6, '49103', 'Goonpisit', 'Chaipayom', 'Jeng', '49103'),
(5, 13, 7, '49105', 'Napat', 'Janngam', 'Prite', '49105'),
(5, 13, 8, '51139', 'Chayagone', 'Limwongsakul', 'Int', '51139'),
(5, 13, 9, '51140', 'Noppadol', 'Suaykhakhao', 'Mark', '51140'),
(5, 13, 10, '51141', 'Narapat', 'Teeratanatanyboon', 'Teego', '51141'),
(5, 13, 11, '51142', 'Arnon', 'Danfmukda', 'Gun', '51142'),
(5, 13, 12, '51154', 'A Zin', 'Lin Myat', 'An An', '51154'),
(5, 13, 13, '48473', 'Pimpattra', 'Archanukulrat', 'Mind', '48473'),
(5, 13, 14, '49110', 'Panicha', 'Sirachatpatiphan', 'Pluemjai', '49110'),
(5, 13, 15, '49116', 'Supasuta', 'Chesadatas', 'Jeenjeen', '49116'),
(5, 13, 16, '51143', 'Pichnaree', 'Pungsiricharoen', 'Junoir', '51143'),
(5, 14, 1, '49090', 'Mr. Nathapong', 'Meesuk', 'Leezan', '49090'),
(5, 14, 2, '49093', 'Mr. Papangkorn', 'Yingohonphatsorn', 'Pengkuang', '49093'),
(5, 14, 3, '49104', 'Phophtam', 'Swangsang', 'Dod', '49104'),
(5, 14, 4, '49109', 'Mr. Sorrasit', 'Viravendej', 'Soba', '49109'),
(5, 14, 5, '49039', 'Phitchaya', 'Kaikeaw', 'Khao', '49039'),
(5, 14, 6, '49096', 'Nichapath', 'Chunlawithet', 'Acare', '49096'),
(5, 14, 7, '51145', 'Sojung', 'Lim', 'Mirin', '51145'),
(5, 14, 8, '51146', 'Nannapat', 'Kotchasarn', 'Lyn', '51146'),
(5, 14, 9, '51147', 'Rarunphat', 'Nantaraweewat', 'Kaopoad', '51147'),
(5, 14, 10, '51161', 'Sarareewan', 'Reenawong', 'Pear', '51161'),


(6, 13, 1, '48407', 'Pongkrit', 'Suksomkit', 'Blank', '48407'),
(6, 13, 2, '48462', 'Peerawit', 'Sirithongkaset', 'Blank', '48462'),
(6, 13, 3, '48463', 'Phubadin', 'Pokkasub', 'Blank', '48463'),
(6, 13, 4, '48464', 'Raiwin', 'Waratpraveethorn', 'Blank', '48464'),
(6, 13, 5, '48481', 'Jirayu', 'Boonpaisandilok', 'Blank', '48481'),
(6, 13, 6, '48482', 'Nattaphat', 'Kiatwisarlchai', 'Blank', '48482'),
(6, 13, 7, '48484', 'Thanawit', 'Wongpiphun', 'Blank', '48484'),
(6, 13, 8, '48485', 'Thatchapon', 'Plallek', 'Blank', '48485'),
(6, 13, 9, '48488', 'Phumiphat', 'Chankamchon', 'Blank', '48488'),
(6, 13, 10, '50435', 'Thanpisit', 'Chongwilaikasem', 'Blank', '50435'),
(6, 13, 11, '48465', 'Karnpitcha', 'Jamchuntra', 'Blank', '48465'),
(6, 13, 12, '48466', 'Karnsiree', 'Rungsansert', 'Blank', '48466'),
(6, 13, 13, '48467', 'Grace', 'Tingsomchaisilp', 'Blank', '48467'),
(6, 13, 14, '48469', 'Nichawan', 'Nithithongsakul', 'Blank', '48469'),
(6, 13, 15, '48475', 'Sirikanya', 'Padkaew', 'Blank', '48475'),
(6, 13, 16, '48492', 'Yadapat', 'Phupayakhutpong', 'Blank', '48492'),
(6, 13, 17, '48497', 'Franchesca Sophia', 'Andrada', 'Blank', '48497'),
(6, 13, 18, '48460', 'Natawan', 'Charnnarongkul', 'Blank', '48460'),
(6, 14, 1, '48457', 'Eakkanin', 'Sithchaisurakool', 'Munich', '48457'),
(6, 14, 2, '48458', 'Chayodom', 'Disayawan', 'Bright', '48458'),
(6, 14, 3, '48461', 'Thannadon', 'Chimree', 'Don', '48461'),
(6, 14, 4, '48483', 'Dollar', 'Pemredang', 'Dollar', '48483'),
(6, 14, 5, '50438', 'Korrakod', 'Bookkaluck', 'Tonmai', '50438'),
(6, 14, 6, '50439', 'Teeradech', 'Pattamasopa', 'Pupha', '50439'),
(6, 14, 7, '48489', 'Kodchakorn', 'Chongkwanyuen', 'Oil', '48489'),
(6, 14, 8, '48490', 'Janapat', 'Khamsanthia', 'Gift', '48490'),
(6, 14, 9, '48491', 'Thanyamas', 'Eamwarakul', 'Ink', '48491'),
(6, 14, 10, '48496', 'Pornnatcha', 'Neramit', 'Tongkaw', '48496'),
(6, 14, 11, '48498', 'Peerada', 'Chubunjong', 'Bam', '48498'),
(6, 14, 12, '48500', 'Wilasinee', 'Thonglue', 'Praew', '48500'),
(6, 14, 13, '48501', 'Suphattiya', 'Wungkeangtham', 'Noodee', '48501'),
(6, 14, 14, '50323', 'Yang', 'Qixuan', 'Sayo', '50323'),
(6, 14, 15, '50440', 'Kunpriya', 'Butnamrak', 'New', '50440'),
(6, 14, 16, '50442', 'Arada', 'Wang', 'Ing', '50442');


INSERT INTO academic_year (academic_year, semester, term, start_date, end_date) VALUES
('2025-2026', 1, 1, '2025-05-01', '2025-07-15'),
('2025-2026', 1, 2, '2025-07-16', '2025-09-30'),
('2025-2026', 2, 1, '2025-10-01', '2026-01-10'),
('2025-2026', 2, 2, '2026-01-11', '2026-04-30'),
('2026-2027', 1, 1, '2026-05-01', '2026-07-15'),
('2026-2027', 1, 2, '2026-07-16', '2026-09-12'),
('2026-2027', 2, 1, '2026-10-01', '2027-01-10'),
('2026-2027', 2, 2, '2027-01-11', '2027-04-30');


INSERT INTO teachers (teacher_id, username, password) VALUES
('Aleksandr_Petrov', 'Alex', '465'),
('Charlie_Viernes', 'Charlie', '465');


INSERT INTO admin (username, password) VALUES
('admin', 'maxpower');




INSERT INTO subjects (subject) VALUES
('Listening and Speaking'),
('English for career'),
('Tourism'),
('Reading and Writing'),
('Geography'),
('Grammar'),
('English for Communication'),
('Health'),
('Science Fundamental'),
('Science Supplementary'),
('Biology'),
('Math Fundamental'),
('Math Supplementary');


CREATE INDEX idx_users_student_id ON users(student_id);
CREATE INDEX idx_users_grade_class ON users(grade, class);
CREATE INDEX idx_test_results_student_id ON multiple_choice_test_results(student_id);
CREATE INDEX idx_test_results_student_id ON true_false_test_results(student_id);
CREATE INDEX idx_test_results_student_id ON input_test_results(student_id);
CREATE INDEX idx_test_results_academic_period ON multiple_choice_test_results(academic_period_id);
CREATE INDEX idx_test_results_academic_period ON true_false_test_results(academic_period_id);
CREATE INDEX idx_test_results_academic_period ON input_test_results(academic_period_id);

-- Indexes for matching type test tables
CREATE INDEX idx_matching_tests_teacher_id ON matching_type_tests(teacher_id);
CREATE INDEX idx_matching_questions_test_id ON matching_type_test_questions(test_id);
CREATE INDEX idx_matching_arrows_question_id ON matching_type_test_arrows(question_id);
CREATE INDEX idx_matching_results_student_id ON matching_type_test_results(student_id);
CREATE INDEX idx_matching_results_academic_period ON matching_type_test_results(academic_period_id);


-- Note: test_id, subject_id, and password columns already exist in table definitions above

-- Add additional useful tables

-- Test attempts tracking (for retake functionality)
CREATE TABLE test_attempts (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(10) REFERENCES users(student_id),
    test_id INTEGER NOT NULL,
    attempt_number INTEGER NOT NULL,
    score INTEGER,
    max_score INTEGER,
    percentage DECIMAL(5,2),
    time_taken INTEGER, -- in seconds
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, test_id, attempt_number)
);



-- Note: Student progress can be calculated from student_results_view

-- Test analytics and statistics
CREATE TABLE test_analytics (
    id SERIAL PRIMARY KEY,
    test_id INTEGER NOT NULL,
    academic_period_id INTEGER REFERENCES academic_year(id),
    total_attempts INTEGER DEFAULT 0,
    average_score DECIMAL(5,2),
    highest_score INTEGER,
    lowest_score INTEGER,
    completion_rate DECIMAL(5,2),
    average_time_taken INTEGER, -- in seconds
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(test_id, academic_period_id)
);

-- Additional indexes for performance
CREATE INDEX idx_test_assignments_teacher_id ON test_assignments(teacher_id);
CREATE INDEX idx_test_assignments_academic_period ON test_assignments(academic_period_id);
CREATE INDEX idx_test_assignments_grade_class ON test_assignments(grade, class);
CREATE INDEX idx_test_assignments_subject_id ON test_assignments(subject_id);

CREATE INDEX idx_test_results_teacher_id ON multiple_choice_test_results(teacher_id);
CREATE INDEX idx_test_results_teacher_id ON true_false_test_results(teacher_id);
CREATE INDEX idx_test_results_teacher_id ON input_test_results(teacher_id);
CREATE INDEX idx_test_results_teacher_id ON matching_type_test_results(teacher_id);

CREATE INDEX idx_test_results_subject_id ON multiple_choice_test_results(subject_id);
CREATE INDEX idx_test_results_subject_id ON true_false_test_results(subject_id);
CREATE INDEX idx_test_results_subject_id ON input_test_results(subject_id);
CREATE INDEX idx_test_results_subject_id ON matching_type_test_results(subject_id);

CREATE INDEX idx_test_results_test_id ON multiple_choice_test_results(test_id);
CREATE INDEX idx_test_results_test_id ON true_false_test_results(test_id);
CREATE INDEX idx_test_results_test_id ON input_test_results(test_id);
CREATE INDEX idx_test_results_test_id ON matching_type_test_results(test_id);

CREATE INDEX idx_test_attempts_student_test ON test_attempts(student_id, test_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_student_test_percentage ON test_attempts(student_id, test_id, percentage DESC, attempt_number DESC) INCLUDE (score, max_score, submitted_at) WHERE retest_assignment_id IS NOT NULL;
CREATE INDEX idx_test_analytics_test_period ON test_analytics(test_id, academic_period_id);

-- Additional useful tables for enhanced functionality

-- ========================================
-- STUDENT RESULTS VIEW TABLES FOR CABINETS
-- ========================================

-- Teacher Results View - All Students' Detailed Results
CREATE TABLE teacher_student_results_view (
    id SERIAL PRIMARY KEY,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    grade INTEGER NOT NULL,
    class INTEGER NOT NULL,
    academic_period_id INTEGER REFERENCES academic_year(id),
    
    -- Student Information (with proper references)
    student_id VARCHAR(10) REFERENCES users(student_id),
    
    -- Foreign key constraint to ensure student exists
    FOREIGN KEY (student_id) REFERENCES users(student_id),
    
    -- Test Information
    test_id INTEGER NOT NULL,
    test_name VARCHAR(200) NOT NULL,
    
    -- Test Results
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    time_taken INTEGER, -- in seconds
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    
    -- Cheating Detection
    caught_cheating BOOLEAN DEFAULT false,
    visibility_change_times INTEGER DEFAULT 0,
    
    -- Completion Status
    is_completed BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student Results View - Personal Results Only
CREATE TABLE student_results_view (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(10) REFERENCES users(student_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    grade INTEGER NOT NULL,
    class INTEGER NOT NULL,
    academic_period_id INTEGER REFERENCES academic_year(id),
    
    -- Foreign key constraint to ensure student exists
    FOREIGN KEY (student_id) REFERENCES users(student_id),
    
    -- Test Information
    test_id INTEGER NOT NULL,
    test_name VARCHAR(200) NOT NULL,
    
    -- Test Results
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,

    
    -- Personal Progress

    improvement_from_last DECIMAL(5,2), -- improvement from previous attempt
    
    -- Cheating Detection (students can see their own behavior)
    caught_cheating BOOLEAN DEFAULT false,
    visibility_change_times INTEGER DEFAULT 0,
    
    -- Completion Status
    is_completed BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Class Summary View - Aggregated Statistics for Teachers
CREATE TABLE class_summary_view (
    id SERIAL PRIMARY KEY,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    grade INTEGER NOT NULL,
    class INTEGER NOT NULL,
    academic_period_id INTEGER REFERENCES academic_year(id),
    
    -- Class Statistics
    total_students INTEGER DEFAULT 0,
    total_tests INTEGER DEFAULT 0,
    completed_tests INTEGER DEFAULT 0,
    average_class_score DECIMAL(5,2),
    highest_score INTEGER,
    lowest_score INTEGER,
    
    -- Performance Metrics
    pass_rate DECIMAL(5,2), -- percentage of students who passed
    cheating_incidents INTEGER DEFAULT 0,
    high_visibility_change_students INTEGER DEFAULT 0, -- students with >5 tab switches
    
    -- Recent Activity
    last_test_date TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(teacher_id, subject_id, grade, class, academic_period_id)
);

-- Indexes for Student Results View Tables
CREATE INDEX idx_teacher_student_results_teacher ON teacher_student_results_view(teacher_id);
CREATE INDEX idx_teacher_student_results_subject ON teacher_student_results_view(subject_id);
CREATE INDEX idx_teacher_student_results_class ON teacher_student_results_view(grade, class);
CREATE INDEX idx_teacher_student_results_period ON teacher_student_results_view(academic_period_id);
CREATE INDEX idx_teacher_student_results_student ON teacher_student_results_view(student_id);
CREATE INDEX idx_teacher_student_results_test ON teacher_student_results_view(test_id);

CREATE INDEX idx_student_results_student ON student_results_view(student_id);
CREATE INDEX idx_student_results_subject ON student_results_view(subject_id);
CREATE INDEX idx_student_results_class ON student_results_view(grade, class);
CREATE INDEX idx_student_results_period ON student_results_view(academic_period_id);
CREATE INDEX idx_student_results_test ON student_results_view(test_id);

CREATE INDEX idx_class_summary_teacher ON class_summary_view(teacher_id);
CREATE INDEX idx_class_summary_subject ON class_summary_view(subject_id);
CREATE INDEX idx_class_summary_class ON class_summary_view(grade, class);
CREATE INDEX idx_class_summary_period ON class_summary_view(academic_period_id);

-- Word Matching Test Tables
CREATE TABLE word_matching_tests (
    id SERIAL PRIMARY KEY,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    test_name VARCHAR(200) NOT NULL,
    num_questions INTEGER NOT NULL,
    interaction_type VARCHAR(20) NOT NULL DEFAULT 'drag', -- 'drag' or 'arrow'
    passing_score INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE word_matching_questions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES word_matching_tests(id),
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    question_id INTEGER NOT NULL,
    left_word TEXT NOT NULL,
    right_word TEXT NOT NULL
);

CREATE TABLE word_matching_test_results (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES word_matching_tests(id),
    test_name VARCHAR(200) NOT NULL,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    grade INTEGER NOT NULL,
    class INTEGER NOT NULL,
    number INTEGER NOT NULL,
    student_id VARCHAR(10) REFERENCES users(student_id),
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    percentage DECIMAL(5,2) GENERATED ALWAYS AS (ROUND((score::DECIMAL / max_score::DECIMAL) * 100, 2)) STORED,
    answers JSONB NOT NULL,
    time_taken INTEGER,
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    caught_cheating BOOLEAN DEFAULT false,
    visibility_change_times INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    academic_period_id INTEGER REFERENCES academic_year(id)
);

-- Indexes for word matching tables
CREATE INDEX idx_word_matching_tests_teacher ON word_matching_tests(teacher_id);
CREATE INDEX idx_word_matching_tests_subject ON word_matching_tests(subject_id);
CREATE INDEX idx_word_matching_questions_test ON word_matching_questions(test_id);
CREATE INDEX idx_word_matching_questions_teacher ON word_matching_questions(teacher_id);
CREATE INDEX idx_word_matching_results_test ON word_matching_test_results(test_id);
CREATE INDEX idx_word_matching_results_student ON word_matching_test_results(student_id);
CREATE INDEX idx_word_matching_results_class ON word_matching_test_results(grade, class);
CREATE INDEX idx_word_matching_results_period ON word_matching_test_results(academic_period_id);

-- 1. Main Drawing Tests Table
CREATE TABLE drawing_tests (
    id SERIAL PRIMARY KEY,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    test_name VARCHAR(200) NOT NULL,
    num_questions INTEGER NOT NULL DEFAULT 1 CHECK (num_questions >= 1 AND num_questions <= 3),
    passing_score INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Drawing Test Questions Table
CREATE TABLE drawing_test_questions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES drawing_tests(id),
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    question_id INTEGER NOT NULL,
    question_json JSONB NOT NULL, -- Lexical editor content for this question
    canvas_width INTEGER DEFAULT 600, -- Individual canvas width for this question
    canvas_height INTEGER DEFAULT 800, -- Individual canvas height for this question
    max_canvas_width INTEGER DEFAULT 1536, -- Maximum canvas width for this question
    max_canvas_height INTEGER DEFAULT 2048, -- Maximum canvas height for this question
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Drawing Test Results Table
CREATE TABLE drawing_test_results (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES drawing_tests(id),
    test_name VARCHAR(200) NOT NULL,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    grade INTEGER NOT NULL,
    class INTEGER NOT NULL,
    number INTEGER NOT NULL,
    student_id VARCHAR(10) REFERENCES users(student_id),
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    score INTEGER,
    max_score INTEGER,
    percentage DECIMAL(5,2) GENERATED ALWAYS AS (ROUND((score::DECIMAL / max_score::DECIMAL) * 100, 2)) STORED,
    answers JSONB NOT NULL, -- Drawing URLs, canvas dimensions, and metadata
    time_taken INTEGER, -- in seconds
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    caught_cheating BOOLEAN DEFAULT false,
    visibility_change_times INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    academic_period_id INTEGER REFERENCES academic_year(id)
);

-- 4. Drawing Test Images Table (for individual question drawings)
CREATE TABLE drawing_test_images (
    id SERIAL PRIMARY KEY,
    result_id INTEGER REFERENCES drawing_test_results(id),
    question_id INTEGER NOT NULL,
    drawing_url TEXT NOT NULL, -- Cloudinary URL
    drawing_data JSONB, -- Canvas state data (optional)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_drawing_tests_teacher_id ON drawing_tests(teacher_id);
CREATE INDEX idx_drawing_tests_subject_id ON drawing_tests(subject_id);
CREATE INDEX idx_drawing_test_questions_test_id ON drawing_test_questions(test_id);
CREATE INDEX idx_drawing_test_results_test_id ON drawing_test_results(test_id);
CREATE INDEX idx_drawing_test_results_student_id ON drawing_test_results(student_id);
CREATE INDEX idx_drawing_test_results_teacher_id ON drawing_test_results(teacher_id);
CREATE INDEX idx_drawing_test_images_result_id ON drawing_test_images(result_id);

-- ========================================
-- TIMER SUPPORT: per-test allowed_time (seconds)
-- ========================================
ALTER TABLE multiple_choice_tests ADD COLUMN IF NOT EXISTS allowed_time INTEGER;
ALTER TABLE true_false_tests ADD COLUMN IF NOT EXISTS allowed_time INTEGER;
ALTER TABLE input_tests ADD COLUMN IF NOT EXISTS allowed_time INTEGER;
ALTER TABLE matching_type_tests ADD COLUMN IF NOT EXISTS allowed_time INTEGER;
ALTER TABLE word_matching_tests ADD COLUMN IF NOT EXISTS allowed_time INTEGER;
ALTER TABLE drawing_tests ADD COLUMN IF NOT EXISTS allowed_time INTEGER;
-- Question shuffle flag for supported tests
ALTER TABLE multiple_choice_tests ADD COLUMN IF NOT EXISTS is_shuffled BOOLEAN DEFAULT FALSE;
ALTER TABLE true_false_tests ADD COLUMN IF NOT EXISTS is_shuffled BOOLEAN DEFAULT FALSE;
ALTER TABLE input_tests ADD COLUMN IF NOT EXISTS is_shuffled BOOLEAN DEFAULT FALSE;
-- Optional per-assignment override (uncomment if needed)
-- ALTER TABLE test_assignments ADD COLUMN IF NOT EXISTS allowed_time INTEGER;

-- ========================================
-- CLASS SUMMARY VIEW OPTIMIZATION
-- ========================================

-- Drop the existing table
DROP TABLE IF EXISTS class_summary_view CASCADE;

-- Create the materialized view that aggregates from actual test results
CREATE MATERIALIZED VIEW class_summary_view AS
WITH all_test_results AS (
    -- Multiple Choice Test Results
    SELECT 
        teacher_id,
        subject_id,
        grade,
        class,
        academic_period_id,
        test_id,
        test_name,
        student_id,
        score,
        max_score,
        percentage,
        submitted_at,
        caught_cheating,
        visibility_change_times,
        is_completed
    FROM multiple_choice_test_results
    
    UNION ALL
    
    -- True/False Test Results
    SELECT 
        teacher_id,
        subject_id,
        grade,
        class,
        academic_period_id,
        test_id,
        test_name,
        student_id,
        score,
        max_score,
        percentage,
        submitted_at,
        caught_cheating,
        visibility_change_times,
        is_completed
    FROM true_false_test_results
    
    UNION ALL
    
    -- Input Test Results
    SELECT 
        teacher_id,
        subject_id,
        grade,
        class,
        academic_period_id,
        test_id,
        test_name,
        student_id,
        score,
        max_score,
        percentage,
        submitted_at,
        caught_cheating,
        visibility_change_times,
        is_completed
    FROM input_test_results
    
    UNION ALL
    
    -- Matching Type Test Results
    SELECT 
        teacher_id,
        subject_id,
        grade,
        class,
        academic_period_id,
        test_id,
        test_name,
        student_id,
        score,
        max_score,
        percentage,
        submitted_at,
        caught_cheating,
        visibility_change_times,
        is_completed
    FROM matching_type_test_results
    
    UNION ALL
    
    -- Word Matching Test Results
    SELECT 
        teacher_id,
        subject_id,
        grade,
        class,
        academic_period_id,
        test_id,
        test_name,
        student_id,
        score,
        max_score,
        percentage,
        submitted_at,
        caught_cheating,
        visibility_change_times,
        is_completed
    FROM word_matching_test_results
    
    UNION ALL
    
    -- Drawing Test Results
    SELECT 
        teacher_id,
        subject_id,
        grade,
        class,
        academic_period_id,
        test_id,
        test_name,
        student_id,
        score,
        max_score,
        percentage,
        submitted_at,
        caught_cheating,
        visibility_change_times,
        is_completed
    FROM drawing_test_results
),
class_stats AS (
    SELECT 
        teacher_id,
        subject_id,
        grade,
        class,
        academic_period_id,
        
        -- Student counts
        COUNT(DISTINCT student_id) as total_students,
        
        -- Test counts
        COUNT(DISTINCT test_id) as total_tests,
        COUNT(*) as completed_tests,
        
        -- Score statistics
        ROUND(AVG(percentage), 2) as average_class_score,
        MAX(score) as highest_score,
        MIN(score) as lowest_score,
        
        -- Performance metrics
        ROUND(
            (COUNT(CASE WHEN percentage >= 60 THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2
        ) as pass_rate,
        
        -- Cheating incidents
        COUNT(CASE WHEN caught_cheating = true THEN 1 END) as cheating_incidents,
        COUNT(CASE WHEN visibility_change_times > 5 THEN 1 END) as high_visibility_change_students,
        
        -- Recent activity
        MAX(submitted_at) as last_test_date,
        CURRENT_TIMESTAMP as last_updated
        
    FROM all_test_results
    WHERE is_completed = true
    GROUP BY teacher_id, subject_id, grade, class, academic_period_id
)
SELECT 
    ROW_NUMBER() OVER (ORDER BY teacher_id, subject_id, grade, class, academic_period_id) as id,
    teacher_id,
    subject_id,
    grade,
    class,
    academic_period_id,
    total_students,
    total_tests,
    completed_tests,
    average_class_score,
    highest_score,
    lowest_score,
    pass_rate,
    cheating_incidents,
    high_visibility_change_students,
    last_test_date,
    last_updated,
    CURRENT_TIMESTAMP as created_at,
    CURRENT_TIMESTAMP as updated_at
FROM class_stats;

-- Create indexes for performance on underlying tables
CREATE INDEX IF NOT EXISTS idx_mc_results_teacher_grade_class_period 
ON multiple_choice_test_results(teacher_id, grade, class, academic_period_id);

CREATE INDEX IF NOT EXISTS idx_tf_results_teacher_grade_class_period 
ON true_false_test_results(teacher_id, grade, class, academic_period_id);

CREATE INDEX IF NOT EXISTS idx_input_results_teacher_grade_class_period 
ON input_test_results(teacher_id, grade, class, academic_period_id);

CREATE INDEX IF NOT EXISTS idx_matching_results_teacher_grade_class_period 
ON matching_type_test_results(teacher_id, grade, class, academic_period_id);

CREATE INDEX IF NOT EXISTS idx_word_matching_results_teacher_grade_class_period 
ON word_matching_test_results(teacher_id, grade, class, academic_period_id);

CREATE INDEX IF NOT EXISTS idx_drawing_results_teacher_grade_class_period 
ON drawing_test_results(teacher_id, grade, class, academic_period_id);

-- Add indexes for completion status and cheating detection
CREATE INDEX IF NOT EXISTS idx_mc_results_completed_cheating 
ON multiple_choice_test_results(is_completed, caught_cheating, visibility_change_times);

CREATE INDEX IF NOT EXISTS idx_tf_results_completed_cheating 
ON true_false_test_results(is_completed, caught_cheating, visibility_change_times);

CREATE INDEX IF NOT EXISTS idx_input_results_completed_cheating 
ON input_test_results(is_completed, caught_cheating, visibility_change_times);

CREATE INDEX IF NOT EXISTS idx_matching_results_completed_cheating 
ON matching_type_test_results(is_completed, caught_cheating, visibility_change_times);

CREATE INDEX IF NOT EXISTS idx_word_matching_results_completed_cheating 
ON word_matching_test_results(is_completed, caught_cheating, visibility_change_times);

CREATE INDEX IF NOT EXISTS idx_drawing_results_completed_cheating 
ON drawing_test_results(is_completed, caught_cheating, visibility_change_times);

-- Create indexes on the materialized view for fast queries
CREATE INDEX IF NOT EXISTS idx_class_summary_teacher ON class_summary_view(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_summary_subject ON class_summary_view(subject_id);
CREATE INDEX IF NOT EXISTS idx_class_summary_class ON class_summary_view(grade, class);
CREATE INDEX IF NOT EXISTS idx_class_summary_period ON class_summary_view(academic_period_id);

-- Refresh the materialized view (run this periodically or after test submissions)
-- REFRESH MATERIALIZED VIEW class_summary_view;
-- Fill Blanks Test Tables - Complete Schema
-- This file drops existing tables and creates new ones with the complete schema

-- Fill Blanks Schema Replacement Script
-- This script DROPS the existing fill_blanks_test_results table and recreates it
-- with the standard schema pattern used by other test result tables
-- WARNING: This will DELETE ALL existing Fill Blanks test results data

-- Drop existing Fill Blanks tables in reverse dependency order
DROP TABLE IF EXISTS fill_blanks_test_results CASCADE;
DROP TABLE IF EXISTS fill_blanks_test_questions CASCADE;
DROP TABLE IF EXISTS fill_blanks_tests CASCADE;

-- Recreate Fill Blanks Tests table (main test table)
CREATE TABLE fill_blanks_tests (
    id SERIAL PRIMARY KEY,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    test_name VARCHAR(200) NOT NULL,
    test_text TEXT NOT NULL, -- Full text content from Lexical editor
    num_questions INTEGER NOT NULL,
    num_blanks INTEGER NOT NULL, -- Number of blanks in the text
    separate_type BOOLEAN DEFAULT TRUE, -- TRUE = separate mode, FALSE = inline mode
    passing_score INTEGER,
    allowed_time INTEGER, -- Timer support
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recreate Fill Blanks Test Questions table
CREATE TABLE fill_blanks_test_questions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES fill_blanks_tests(id) ON DELETE CASCADE,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    question_id INTEGER NOT NULL, -- Question number (1, 2, 3, etc.)
    question_json JSONB NOT NULL, -- Question text for this blank
    blank_positions JSONB NOT NULL, -- Position of blank in main text
    blank_options JSONB NOT NULL, -- Array of answer options
    correct_answers JSONB NOT NULL, -- Correct answer(s) for this blank
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recreate Fill Blanks Test Results table with STANDARD SCHEMA
CREATE TABLE fill_blanks_test_results (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES fill_blanks_tests(id) ON DELETE CASCADE,
    test_name VARCHAR(200) NOT NULL,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    grade INTEGER NOT NULL,
    class INTEGER NOT NULL,
    number INTEGER NOT NULL,
    student_id VARCHAR(10) REFERENCES users(student_id),
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    percentage DECIMAL(5,2) GENERATED ALWAYS AS (ROUND((score::DECIMAL / max_score::DECIMAL) * 100, 2)) STORED,
    answers JSONB NOT NULL, -- Student's answers
    time_taken INTEGER, -- Time taken in seconds
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    caught_cheating BOOLEAN DEFAULT false,
    visibility_change_times INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    academic_period_id INTEGER REFERENCES academic_year(id)
);

-- Create indexes for better performance (matching other test result tables)
CREATE INDEX idx_fill_blanks_tests_teacher_id ON fill_blanks_tests(teacher_id);
CREATE INDEX idx_fill_blanks_tests_subject_id ON fill_blanks_tests(subject_id);
CREATE INDEX idx_fill_blanks_tests_created_at ON fill_blanks_tests(created_at);

CREATE INDEX idx_fill_blanks_questions_test_id ON fill_blanks_test_questions(test_id);
CREATE INDEX idx_fill_blanks_questions_question_id ON fill_blanks_test_questions(question_id);

CREATE INDEX idx_fill_blanks_results_test_id ON fill_blanks_test_results(test_id);
CREATE INDEX idx_fill_blanks_results_student_id ON fill_blanks_test_results(student_id);
CREATE INDEX idx_fill_blanks_results_teacher_id ON fill_blanks_test_results(teacher_id);
CREATE INDEX idx_fill_blanks_results_grade ON fill_blanks_test_results(grade);
CREATE INDEX idx_fill_blanks_results_class ON fill_blanks_test_results(class);
CREATE INDEX idx_fill_blanks_results_academic_period_id ON fill_blanks_test_results(academic_period_id);
CREATE INDEX idx_fill_blanks_results_submitted_at ON fill_blanks_test_results(submitted_at);
CREATE INDEX idx_fill_blanks_results_score ON fill_blanks_test_results(score);



-- Verify the new schema
SELECT 
    'Fill Blanks schema replacement completed successfully' as status,
    'All tables recreated with standard schema' as message,
    'WARNING: All existing Fill Blanks data has been deleted' as warning;

-- ========================================
-- SEMESTER-LEVEL CLASS SUMMARY MATERIALIZED VIEW
-- ========================================



-- Create indexes for performance on underlying tables
CREATE INDEX IF NOT EXISTS idx_mc_results_teacher_grade_class_period 
ON multiple_choice_test_results(teacher_id, grade, class, academic_period_id);

CREATE INDEX IF NOT EXISTS idx_tf_results_teacher_grade_class_period 
ON true_false_test_results(teacher_id, grade, class, academic_period_id);

CREATE INDEX IF NOT EXISTS idx_input_results_teacher_grade_class_period 
ON input_test_results(teacher_id, grade, class, academic_period_id);

CREATE INDEX IF NOT EXISTS idx_matching_results_teacher_grade_class_period 
ON matching_type_test_results(teacher_id, grade, class, academic_period_id);

CREATE INDEX IF NOT EXISTS idx_word_matching_results_teacher_grade_class_period 
ON word_matching_test_results(teacher_id, grade, class, academic_period_id);

CREATE INDEX IF NOT EXISTS idx_drawing_results_teacher_grade_class_period 
ON drawing_test_results(teacher_id, grade, class, academic_period_id);

CREATE INDEX IF NOT EXISTS idx_fill_blanks_results_teacher_grade_class_period 
ON fill_blanks_test_results(teacher_id, grade, class, academic_period_id);

-- Add indexes for completion status and cheating detection
CREATE INDEX IF NOT EXISTS idx_mc_results_completed_cheating 
ON multiple_choice_test_results(is_completed, caught_cheating, visibility_change_times);

CREATE INDEX IF NOT EXISTS idx_tf_results_completed_cheating 
ON true_false_test_results(is_completed, caught_cheating, visibility_change_times);

CREATE INDEX IF NOT EXISTS idx_input_results_completed_cheating 
ON input_test_results(is_completed, caught_cheating, visibility_change_times);

CREATE INDEX IF NOT EXISTS idx_matching_results_completed_cheating 
ON matching_type_test_results(is_completed, caught_cheating, visibility_change_times);

CREATE INDEX IF NOT EXISTS idx_word_matching_results_completed_cheating 
ON word_matching_test_results(is_completed, caught_cheating, visibility_change_times);

CREATE INDEX IF NOT EXISTS idx_drawing_results_completed_cheating 
ON drawing_test_results(is_completed, caught_cheating, visibility_change_times);

CREATE INDEX IF NOT EXISTS idx_fill_blanks_results_completed_cheating 
ON fill_blanks_test_results(caught_cheating, visibility_change_times);

-- Create indexes on the materialized view for fast queries
CREATE INDEX IF NOT EXISTS idx_class_summary_teacher ON class_summary_view(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_summary_subject ON class_summary_view(subject_id);
CREATE INDEX IF NOT EXISTS idx_class_summary_class ON class_summary_view(grade, class);
CREATE INDEX IF NOT EXISTS idx_class_summary_semester ON class_summary_view(academic_year, semester);

-- Refresh the materialized view (run this after creating)
REFRESH MATERIALIZED VIEW class_summary_view;


DELETE FROM teacher_subjects 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM teacher_subjects 
    GROUP BY teacher_id, subject_id, grade, class
);

-- Add the unique constraint
ALTER TABLE teacher_subjects 
ADD CONSTRAINT unique_teacher_subject_grade_class 
UNIQUE (teacher_id, subject_id, grade, class);

-- Create an index for better performance on lookups
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_unique_lookup 
ON teacher_subjects (teacher_id, subject_id, grade, class);

-- Retests feature schema
-- Implements targeted retests per RETESTS_IMPLEMENTATION_PLAN.md
-- Note: We use (test_type, test_id) instead of a single FK to a tests table
-- because tests are stored across multiple tables (multiple_choice, true_false, input, drawing, etc.).

BEGIN;

-- Table: retest_assignments
-- Defines a retest window and policy for a subset of students on a specific original test
CREATE TABLE IF NOT EXISTS retest_assignments (
  id SERIAL PRIMARY KEY,
  test_type VARCHAR(20) NOT NULL,                 -- e.g. 'multiple_choice', 'true_false', 'input', 'drawing', 'matching_type', 'word_matching'
  test_id INTEGER NOT NULL,                       -- original test id in its own table
  teacher_id VARCHAR(50) NOT NULL REFERENCES teachers(teacher_id),
  subject_id INTEGER NOT NULL REFERENCES subjects(subject_id),
  grade INTEGER NOT NULL,
  class INTEGER NOT NULL,
  passing_threshold DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  scoring_policy VARCHAR(10) NOT NULL DEFAULT 'BEST', -- BEST|LATEST|AVERAGE
  max_attempts INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP NOT NULL,
  window_end TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_scoring_policy CHECK (scoring_policy IN ('BEST','LATEST','AVERAGE')),
  CONSTRAINT chk_window CHECK (window_end > window_start),
  CONSTRAINT chk_grade_pos CHECK (grade > 0),
  CONSTRAINT chk_class_pos CHECK (class > 0)
);

-- Helpful indexes for querying active windows and teacher/subject filters
CREATE INDEX IF NOT EXISTS idx_retest_assignments_teacher ON retest_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_retest_assignments_subject ON retest_assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_retest_assignments_test ON retest_assignments(test_type, test_id);
-- Active window partial index (only rows whose window is currently active)
-- Note: Avoid partial index using NOW() (not IMMUTABLE). Use regular indexes instead.
CREATE INDEX IF NOT EXISTS idx_retest_assignments_window_start ON retest_assignments(window_start);
CREATE INDEX IF NOT EXISTS idx_retest_assignments_window_end ON retest_assignments(window_end);
CREATE INDEX IF NOT EXISTS idx_retest_assignments_window_range ON retest_assignments(window_start, window_end);


-- Table: retest_targets
-- Per-student targeting for a given retest assignment
CREATE TABLE IF NOT EXISTS retest_targets (
  id SERIAL PRIMARY KEY,
  retest_assignment_id INTEGER NOT NULL REFERENCES retest_assignments(id) ON DELETE CASCADE,
  student_id VARCHAR(10) NOT NULL REFERENCES users(student_id),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMP,
  status VARCHAR(12) NOT NULL DEFAULT 'PENDING', -- PENDING|IN_PROGRESS|PASSED|FAILED|EXPIRED
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_retest_status CHECK (status IN ('PENDING','IN_PROGRESS','PASSED','FAILED','EXPIRED')),
  CONSTRAINT uq_retest_target UNIQUE (retest_assignment_id, student_id)
);

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_retest_targets_assignment ON retest_targets(retest_assignment_id);
CREATE INDEX IF NOT EXISTS idx_retest_targets_student ON retest_targets(student_id);
CREATE INDEX IF NOT EXISTS idx_retest_targets_status ON retest_targets(status);


-- Optional: augment existing results tables to carry retest metadata directly (uncomment as needed)
-- This improves analytics/join performance but is not strictly required if using test_attempts as the linkage.
--
ALTER TABLE multiple_choice_test_results 
ADD COLUMN IF NOT EXISTS retest_assignment_id INTEGER,
ADD COLUMN IF NOT EXISTS attempt_number INTEGER;
CREATE INDEX IF NOT EXISTS idx_mc_retest_assignment_student 
ON multiple_choice_test_results(retest_assignment_id, student_id);
--
ALTER TABLE true_false_test_results 
  ADD COLUMN IF NOT EXISTS retest_assignment_id INTEGER,
  ADD COLUMN IF NOT EXISTS attempt_number INTEGER;
CREATE INDEX IF NOT EXISTS idx_tf_retest_assignment_student 
  ON true_false_test_results(retest_assignment_id, student_id);

ALTER TABLE input_test_results 
  ADD COLUMN IF NOT EXISTS retest_assignment_id INTEGER,
  ADD COLUMN IF NOT EXISTS attempt_number INTEGER;
CREATE INDEX IF NOT EXISTS idx_input_retest_assignment_student 
  ON input_test_results(retest_assignment_id, student_id);

-- Add for matching type, word matching, fill blanks, drawing
ALTER TABLE matching_type_test_results 
  ADD COLUMN IF NOT EXISTS retest_assignment_id INTEGER,
  ADD COLUMN IF NOT EXISTS attempt_number INTEGER;
CREATE INDEX IF NOT EXISTS idx_match_retest_assignment_student 
  ON matching_type_test_results(retest_assignment_id, student_id);

ALTER TABLE word_matching_test_results 
  ADD COLUMN IF NOT EXISTS retest_assignment_id INTEGER,
  ADD COLUMN IF NOT EXISTS attempt_number INTEGER;
CREATE INDEX IF NOT EXISTS idx_wordmatch_retest_assignment_student 
  ON word_matching_test_results(retest_assignment_id, student_id);

ALTER TABLE fill_blanks_test_results 
  ADD COLUMN IF NOT EXISTS retest_assignment_id INTEGER,
  ADD COLUMN IF NOT EXISTS attempt_number INTEGER;
CREATE INDEX IF NOT EXISTS idx_fillblanks_retest_assignment_student 
  ON fill_blanks_test_results(retest_assignment_id, student_id);

ALTER TABLE drawing_test_results 
  ADD COLUMN IF NOT EXISTS retest_assignment_id INTEGER,
  ADD COLUMN IF NOT EXISTS attempt_number INTEGER;
CREATE INDEX IF NOT EXISTS idx_drawing_retest_assignment_student 
  ON drawing_test_results(retest_assignment_id, student_id);


-- Notes:
-- 1) Submission handlers should update retest_targets.attempt_count/last_attempt_at/status
--    and insert into test_attempts with the computed attempt_number.
-- 2) Semester/class summary views can derive is_retest as (attempt_count > 0 for that test)
--    or by checking presence of retest_assignment_id in result tables if columns are added.

COMMIT;


-- Enhance test_attempts table to store detailed retest data
-- This allows us to store all retest information in one table instead of duplicating in test result tables

-- Add columns for detailed retest data
ALTER TABLE test_attempts 
ADD COLUMN IF NOT EXISTS answers JSONB,
ADD COLUMN IF NOT EXISTS answers_by_id JSONB,
ADD COLUMN IF NOT EXISTS question_order JSONB,
ADD COLUMN IF NOT EXISTS caught_cheating BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS visibility_change_times INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS retest_assignment_id INTEGER,
ADD COLUMN IF NOT EXISTS test_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS teacher_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS subject_id INTEGER,
ADD COLUMN IF NOT EXISTS grade INTEGER,
ADD COLUMN IF NOT EXISTS class INTEGER,
ADD COLUMN IF NOT EXISTS number INTEGER,
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS surname VARCHAR(255),
ADD COLUMN IF NOT EXISTS nickname VARCHAR(255),
ADD COLUMN IF NOT EXISTS academic_period_id INTEGER;

-- Add foreign key constraints
ALTER TABLE test_attempts 
ADD CONSTRAINT fk_test_attempts_retest_assignment 
FOREIGN KEY (retest_assignment_id) REFERENCES retest_assignments(id) ON DELETE CASCADE;

ALTER TABLE test_attempts 
ADD CONSTRAINT fk_test_attempts_subject 
FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE;

ALTER TABLE test_attempts 
ADD CONSTRAINT fk_test_attempts_academic_period 
FOREIGN KEY (academic_period_id) REFERENCES academic_year(id) ON DELETE CASCADE;

-- Store speaking audio URL at top level for easy playback (default NULL; other tests don't set it)
ALTER TABLE test_attempts 
ADD COLUMN IF NOT EXISTS audio_url text DEFAULT NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_test_attempts_retest_assignment ON test_attempts(retest_assignment_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_subject ON test_attempts(subject_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_academic_period ON test_attempts(academic_period_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_teacher ON test_attempts(teacher_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_grade_class ON test_attempts(grade, class);

-- Add comments for documentation
COMMENT ON COLUMN test_attempts.answers IS 'Student answers for this attempt (JSON format)';
COMMENT ON COLUMN test_attempts.answers_by_id IS 'Student answers organized by question ID (JSON format)';
COMMENT ON COLUMN test_attempts.question_order IS 'Order of questions as presented to student (JSON format)';
COMMENT ON COLUMN test_attempts.caught_cheating IS 'Whether student was caught cheating during this attempt';
COMMENT ON COLUMN test_attempts.visibility_change_times IS 'Number of times student changed tab/window visibility';
COMMENT ON COLUMN test_attempts.retest_assignment_id IS 'ID of retest assignment if this is a retest attempt';
COMMENT ON COLUMN test_attempts.test_name IS 'Name of the test';
COMMENT ON COLUMN test_attempts.teacher_id IS 'ID of the teacher who created the test';
COMMENT ON COLUMN test_attempts.subject_id IS 'ID of the subject';
COMMENT ON COLUMN test_attempts.grade IS 'Student grade level';
COMMENT ON COLUMN test_attempts.class IS 'Student class number';
COMMENT ON COLUMN test_attempts.number IS 'Student number in class';
COMMENT ON COLUMN test_attempts.name IS 'Student first name';
COMMENT ON COLUMN test_attempts.surname IS 'Student last name';
COMMENT ON COLUMN test_attempts.nickname IS 'Student nickname';
COMMENT ON COLUMN test_attempts.academic_period_id IS 'ID of the academic period when test was taken';

-- Retest best-attempt index and retest_offered flags for all result tables
-- Safe to run multiple times (IF NOT EXISTS used where applicable)

BEGIN;

-- Best-attempt index only (keep everything else unchanged)
CREATE INDEX IF NOT EXISTS idx_test_attempts_best_pointer
ON test_attempts (
  student_id,
  test_id,
  percentage DESC,
  attempt_number DESC
)
INCLUDE (score, max_score, submitted_at)
WHERE retest_assignment_id IS NOT NULL;

-- Optional: per-result-row linkage to the best retest attempt (pointer only)
-- Adds a nullable column to each results table to store the chosen best retest attempt id
-- No triggers here; you can set this from the API when computing best attempt

ALTER TABLE multiple_choice_test_results
  ADD COLUMN IF NOT EXISTS best_retest_attempt_id bigint;
CREATE INDEX IF NOT EXISTS idx_mc_best_retest_attempt ON multiple_choice_test_results(best_retest_attempt_id);

ALTER TABLE true_false_test_results
  ADD COLUMN IF NOT EXISTS best_retest_attempt_id bigint;
CREATE INDEX IF NOT EXISTS idx_tf_best_retest_attempt ON true_false_test_results(best_retest_attempt_id);

ALTER TABLE input_test_results
  ADD COLUMN IF NOT EXISTS best_retest_attempt_id bigint;
CREATE INDEX IF NOT EXISTS idx_input_best_retest_attempt ON input_test_results(best_retest_attempt_id);

ALTER TABLE matching_type_test_results
  ADD COLUMN IF NOT EXISTS best_retest_attempt_id bigint;
CREATE INDEX IF NOT EXISTS idx_mt_best_retest_attempt ON matching_type_test_results(best_retest_attempt_id);

ALTER TABLE word_matching_test_results
  ADD COLUMN IF NOT EXISTS best_retest_attempt_id bigint;
CREATE INDEX IF NOT EXISTS idx_wm_best_retest_attempt ON word_matching_test_results(best_retest_attempt_id);

ALTER TABLE drawing_test_results
  ADD COLUMN IF NOT EXISTS best_retest_attempt_id bigint;
CREATE INDEX IF NOT EXISTS idx_drawing_best_retest_attempt ON drawing_test_results(best_retest_attempt_id);

ALTER TABLE fill_blanks_test_results
  ADD COLUMN IF NOT EXISTS best_retest_attempt_id bigint;
CREATE INDEX IF NOT EXISTS idx_fb_best_retest_attempt ON fill_blanks_test_results(best_retest_attempt_id);

-- Minimal in-table flag: teacher-offered retest marker (default false)
ALTER TABLE multiple_choice_test_results  ADD COLUMN IF NOT EXISTS retest_offered boolean NOT NULL DEFAULT false;
ALTER TABLE true_false_test_results       ADD COLUMN IF NOT EXISTS retest_offered boolean NOT NULL DEFAULT false;
ALTER TABLE input_test_results            ADD COLUMN IF NOT EXISTS retest_offered boolean NOT NULL DEFAULT false;
ALTER TABLE matching_type_test_results    ADD COLUMN IF NOT EXISTS retest_offered boolean NOT NULL DEFAULT false;
ALTER TABLE word_matching_test_results    ADD COLUMN IF NOT EXISTS retest_offered boolean NOT NULL DEFAULT false;
ALTER TABLE drawing_test_results          ADD COLUMN IF NOT EXISTS retest_offered boolean NOT NULL DEFAULT false;
ALTER TABLE fill_blanks_test_results      ADD COLUMN IF NOT EXISTS retest_offered boolean NOT NULL DEFAULT false;

-- Utility: mark or clear the teacher-offered retest flag across all result tables
CREATE OR REPLACE FUNCTION set_retest_offered(p_student_id text, p_test_id integer, p_flag boolean DEFAULT true)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE multiple_choice_test_results  SET retest_offered = p_flag WHERE student_id = p_student_id AND test_id = p_test_id;
  UPDATE true_false_test_results       SET retest_offered = p_flag WHERE student_id = p_student_id AND test_id = p_test_id;
  UPDATE input_test_results            SET retest_offered = p_flag WHERE student_id = p_student_id AND test_id = p_test_id;
  UPDATE matching_type_test_results    SET retest_offered = p_flag WHERE student_id = p_student_id AND test_id = p_test_id;
  UPDATE word_matching_test_results    SET retest_offered = p_flag WHERE student_id = p_student_id AND test_id = p_test_id;
  UPDATE drawing_test_results          SET retest_offered = p_flag WHERE student_id = p_student_id AND test_id = p_test_id;
  UPDATE fill_blanks_test_results      SET retest_offered = p_flag WHERE student_id = p_student_id AND test_id = p_test_id;
END;
$$;

COMMIT;


-- Compute-and-persist best retest attempt pointer into results tables
-- Safe to run multiple times; uses CREATE OR REPLACE

BEGIN;

-- Helper index (idempotent). If it's already created elsewhere, this will be a no-op.
CREATE INDEX IF NOT EXISTS idx_test_attempts_best_pointer
ON test_attempts (
  student_id,
  test_id,
  percentage DESC,
  attempt_number DESC
)
INCLUDE (id, score, max_score, submitted_at)
WHERE retest_assignment_id IS NOT NULL;

-- Function: update_best_retest_pointer
-- Picks the best retest attempt for the (student_id, test_id) and writes its id
-- into best_retest_attempt_id across the results tables.
-- Persist best retest SCORE/MAX/PERCENTAGE into results tables (not just an attempt id)
-- Safe and idempotent: adds columns if missing and provides a single function to update them.

BEGIN;

-- Add best_retest_* columns to all results tables
ALTER TABLE multiple_choice_test_results  ADD COLUMN IF NOT EXISTS best_retest_score integer;
ALTER TABLE multiple_choice_test_results  ADD COLUMN IF NOT EXISTS best_retest_max_score integer;
ALTER TABLE multiple_choice_test_results  ADD COLUMN IF NOT EXISTS best_retest_percentage numeric;

ALTER TABLE true_false_test_results       ADD COLUMN IF NOT EXISTS best_retest_score integer;
ALTER TABLE true_false_test_results       ADD COLUMN IF NOT EXISTS best_retest_max_score integer;
ALTER TABLE true_false_test_results       ADD COLUMN IF NOT EXISTS best_retest_percentage numeric;

ALTER TABLE input_test_results            ADD COLUMN IF NOT EXISTS best_retest_score integer;
ALTER TABLE input_test_results            ADD COLUMN IF NOT EXISTS best_retest_max_score integer;
ALTER TABLE input_test_results            ADD COLUMN IF NOT EXISTS best_retest_percentage numeric;

ALTER TABLE matching_type_test_results    ADD COLUMN IF NOT EXISTS best_retest_score integer;
ALTER TABLE matching_type_test_results    ADD COLUMN IF NOT EXISTS best_retest_max_score integer;
ALTER TABLE matching_type_test_results    ADD COLUMN IF NOT EXISTS best_retest_percentage numeric;

ALTER TABLE word_matching_test_results    ADD COLUMN IF NOT EXISTS best_retest_score integer;
ALTER TABLE word_matching_test_results    ADD COLUMN IF NOT EXISTS best_retest_max_score integer;
ALTER TABLE word_matching_test_results    ADD COLUMN IF NOT EXISTS best_retest_percentage numeric;

ALTER TABLE drawing_test_results          ADD COLUMN IF NOT EXISTS best_retest_score integer;
ALTER TABLE drawing_test_results          ADD COLUMN IF NOT EXISTS best_retest_max_score integer;
ALTER TABLE drawing_test_results          ADD COLUMN IF NOT EXISTS best_retest_percentage numeric;

ALTER TABLE fill_blanks_test_results      ADD COLUMN IF NOT EXISTS best_retest_score integer;
ALTER TABLE fill_blanks_test_results      ADD COLUMN IF NOT EXISTS best_retest_max_score integer;
ALTER TABLE fill_blanks_test_results      ADD COLUMN IF NOT EXISTS best_retest_percentage numeric;

-- Helper function: compute best retest attempt and persist values into corresponding results row(s)
CREATE OR REPLACE FUNCTION update_best_retest_values(p_student_id text, p_test_id integer)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_score integer;
  v_max   integer;
  v_pct   numeric;
BEGIN
  SELECT ta.score, ta.max_score, ta.percentage
  INTO v_score, v_max, v_pct
  FROM test_attempts ta
  WHERE ta.student_id = p_student_id
    AND ta.test_id = p_test_id
    AND ta.retest_assignment_id IS NOT NULL
  ORDER BY ta.percentage DESC NULLS LAST, ta.attempt_number DESC
  LIMIT 1;

  -- If no retest attempts exist, do nothing (preserve existing values)
  IF v_score IS NOT NULL THEN
    UPDATE multiple_choice_test_results  SET best_retest_score = v_score, best_retest_max_score = v_max, best_retest_percentage = v_pct WHERE student_id = p_student_id AND test_id = p_test_id;
    UPDATE true_false_test_results       SET best_retest_score = v_score, best_retest_max_score = v_max, best_retest_percentage = v_pct WHERE student_id = p_student_id AND test_id = p_test_id;
    UPDATE input_test_results            SET best_retest_score = v_score, best_retest_max_score = v_max, best_retest_percentage = v_pct WHERE student_id = p_student_id AND test_id = p_test_id;
    UPDATE matching_type_test_results    SET best_retest_score = v_score, best_retest_max_score = v_max, best_retest_percentage = v_pct WHERE student_id = p_student_id AND test_id = p_test_id;
    UPDATE word_matching_test_results    SET best_retest_score = v_score, best_retest_max_score = v_max, best_retest_percentage = v_pct WHERE student_id = p_student_id AND test_id = p_test_id;
    UPDATE drawing_test_results          SET best_retest_score = v_score, best_retest_max_score = v_max, best_retest_percentage = v_pct WHERE student_id = p_student_id AND test_id = p_test_id;
    UPDATE fill_blanks_test_results      SET best_retest_score = v_score, best_retest_max_score = v_max, best_retest_percentage = v_pct WHERE student_id = p_student_id AND test_id = p_test_id;
  END IF;
END;
$$;

COMMIT;


ALTER TABLE retest_targets
  ADD COLUMN IF NOT EXISTS status VARCHAR(12) NOT NULL DEFAULT 'PENDING';

CREATE INDEX IF NOT EXISTS idx_retest_targets_status ON retest_targets(status);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_retest_status'
      AND conrelid = 'retest_targets'::regclass
  ) THEN
    ALTER TABLE retest_targets
      ADD CONSTRAINT chk_retest_status
      CHECK (status IN ('PENDING','IN_PROGRESS','PASSED','FAILED','EXPIRED'));
  END IF;
END$$;


-- Speaking Test Database Schema
-- Follows standard test structure with automatic scoring system
-- Implements: Word Count (30%), Grammar (40%), Vocabulary (30%) scoring

-- ========================================
-- CLEANUP PREVIOUS TABLES
-- ========================================

-- Drop existing speaking test tables in reverse dependency order
DROP TABLE IF EXISTS speaking_test_audio CASCADE;
DROP TABLE IF EXISTS speaking_test_results CASCADE;
DROP TABLE IF EXISTS speaking_test_questions CASCADE;
DROP TABLE IF EXISTS speaking_tests CASCADE;

-- ========================================
-- SPEAKING TEST TABLES
-- ========================================

-- 1. Main Speaking Tests Table
CREATE TABLE IF NOT EXISTS speaking_tests (
    id SERIAL PRIMARY KEY,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    test_name VARCHAR(200) NOT NULL,
    num_questions INTEGER NOT NULL DEFAULT 1, -- Number of speaking prompts/questions
    time_limit INTEGER DEFAULT 300, -- Maximum recording time in seconds
    min_duration INTEGER DEFAULT 30, -- Minimum recording duration in seconds
    max_duration INTEGER DEFAULT 600, -- Maximum recording duration in seconds
    max_attempts INTEGER DEFAULT 3, -- Maximum retry attempts allowed
    
    -- Basic Test Configuration
    min_words INTEGER DEFAULT 50, -- Minimum word count required
    
    
    -- Standard test fields
    passing_score INTEGER,
    allowed_time INTEGER, -- Timer support
    is_shuffled BOOLEAN DEFAULT FALSE, -- Not applicable for speaking tests
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_num_questions CHECK (num_questions > 0),
    CONSTRAINT chk_min_words CHECK (min_words > 0),
    CONSTRAINT chk_duration CHECK (min_duration <= max_duration),
    CONSTRAINT chk_time_limit CHECK (time_limit > 0),
    CONSTRAINT chk_max_attempts CHECK (max_attempts > 0)
);

-- 2. Speaking Test Questions Table
CREATE TABLE IF NOT EXISTS speaking_test_questions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES speaking_tests(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    prompt TEXT NOT NULL, -- Speaking prompt/topic for students
    expected_duration INTEGER, -- Expected response duration in seconds
    difficulty_level VARCHAR(20) DEFAULT 'medium', -- easy, medium, hard
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_question_number CHECK (question_number > 0),
    CONSTRAINT chk_expected_duration CHECK (expected_duration > 0)
);

-- 3. Speaking Test Results Table (Standard Schema)
CREATE TABLE IF NOT EXISTS speaking_test_results (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES speaking_tests(id),
    test_name VARCHAR(200) NOT NULL,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    grade INTEGER NOT NULL,
    class INTEGER NOT NULL,
    number INTEGER,
    student_id VARCHAR(50) REFERENCES users(student_id),
    name VARCHAR(100),
    surname VARCHAR(100),
    nickname VARCHAR(100),
    academic_period_id INTEGER REFERENCES academic_year(id),
    
    -- Speaking Test Specific Fields
    question_id INTEGER REFERENCES speaking_test_questions(id), -- Link to the specific question
    audio_url TEXT, -- URL to the student's recorded audio in Supabase
    transcript TEXT, -- Full transcript from speech-to-text service
    word_count INTEGER, -- Actual word count from transcript
    grammar_mistakes INTEGER DEFAULT 0, -- Number of grammar mistakes
    vocabulary_mistakes INTEGER DEFAULT 0, -- Number of vocabulary mistakes (e.g., repeated words, simple vocab)
    
    -- Final Score (0-100)
    overall_score DECIMAL(5,2), -- Total score (0-100)
    percentage DECIMAL(5,2) GENERATED ALWAYS AS (overall_score) STORED,
    
    -- Standard test result fields
    time_taken INTEGER, -- Time taken in seconds
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    caught_cheating BOOLEAN DEFAULT false,
    visibility_change_times INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    retest_offered BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Retest specific fields (for displaying best retest score in results)
    retest_assignment_id INTEGER REFERENCES retest_assignments(id),
    best_retest_score INTEGER,
    best_retest_max_score INTEGER,
    best_retest_percentage DECIMAL(5,2),
    
    -- AI Feedback Storage
    ai_feedback JSONB -- Complete AI analysis payload (scores, feedback, corrections, etc.)
);


-- ========================================
-- SCORING NOTES
-- ========================================

-- Automatic scoring is handled entirely in the backend:
-- 1. Word Count Score (30%): min(actual_words / min_words, 1) * 30
-- 2. Grammar Score (40%): max(40 - (grammar_mistakes * 2), 0)  
-- 3. Vocabulary Score (30%): max(30 - (vocab_mistakes * 2), 0)
-- 4. Total Score: word_score + grammar_score + vocab_score
-- 
-- Backend stores only the final overall_score (0-100) in the database
-- All scoring configuration and calculation logic is in the backend code

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Speaking tests indexes
CREATE INDEX IF NOT EXISTS idx_speaking_tests_teacher_id ON speaking_tests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_speaking_tests_subject_id ON speaking_tests(subject_id);
CREATE INDEX IF NOT EXISTS idx_speaking_tests_created_at ON speaking_tests(created_at);

-- Speaking test questions indexes
CREATE INDEX IF NOT EXISTS idx_speaking_questions_test_id ON speaking_test_questions(test_id);
CREATE INDEX IF NOT EXISTS idx_speaking_questions_number ON speaking_test_questions(question_number);

-- Speaking test results indexes
CREATE INDEX IF NOT EXISTS idx_speaking_results_test_id ON speaking_test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_speaking_results_student_id ON speaking_test_results(student_id);
CREATE INDEX IF NOT EXISTS idx_speaking_results_teacher_id ON speaking_test_results(teacher_id);
CREATE INDEX IF NOT EXISTS idx_speaking_results_grade ON speaking_test_results(grade);
CREATE INDEX IF NOT EXISTS idx_speaking_results_class ON speaking_test_results(class);
CREATE INDEX IF NOT EXISTS idx_speaking_results_academic_period_id ON speaking_test_results(academic_period_id);
CREATE INDEX IF NOT EXISTS idx_speaking_results_submitted_at ON speaking_test_results(submitted_at);
CREATE INDEX IF NOT EXISTS idx_speaking_results_score ON speaking_test_results(overall_score);
CREATE INDEX IF NOT EXISTS idx_speaking_results_completed_cheating ON speaking_test_results(is_completed, caught_cheating, visibility_change_times);
CREATE INDEX IF NOT EXISTS idx_speaking_results_question_id ON speaking_test_results(question_id);
CREATE INDEX IF NOT EXISTS idx_speaking_results_retest_assignment_id ON speaking_test_results(retest_assignment_id);
CREATE INDEX IF NOT EXISTS idx_speaking_results_ai_feedback ON speaking_test_results USING GIN (ai_feedback);

-- Speaking test audio indexes
CREATE INDEX IF NOT EXISTS idx_speaking_audio_result_id ON speaking_test_audio(result_id);
CREATE INDEX IF NOT EXISTS idx_speaking_audio_created_at ON speaking_test_audio(created_at);

-- ========================================
-- UPDATE CLASS SUMMARY VIEW
-- ========================================

-- Add speaking test results to the materialized view
-- Note: This would require updating the existing materialized view
-- to include speaking_test_results in the UNION ALL sections

-- ========================================
-- SAMPLE DATA AND TESTING
-- ========================================


-- ========================================
-- USAGE EXAMPLES
-- ========================================

-- Example: Get speaking test results with scores
/*
SELECT 
    str.id,
    str.student_id,
    str.name,
    str.transcript,
    str.word_count,
    str.word_score,
    str.grammar_score,
    str.vocab_score,
    str.overall_score,
    st.min_words,
    stq.prompt
FROM speaking_test_results str
JOIN speaking_tests st ON str.test_id = st.id
JOIN speaking_test_questions stq ON stq.test_id = st.id
WHERE str.is_completed = true
ORDER BY str.overall_score DESC;
*/

-- ========================================
-- COMMENTS AND DOCUMENTATION
-- ========================================

COMMENT ON TABLE speaking_tests IS 'Main table for speaking test configurations';
COMMENT ON TABLE speaking_test_questions IS 'Speaking test questions with prompts';
COMMENT ON TABLE speaking_test_results IS 'Student speaking test results with automatic scoring';


COMMENT ON COLUMN speaking_test_questions.prompt IS 'Speaking topic/prompt for students';
COMMENT ON COLUMN speaking_tests.min_words IS 'Minimum word count required for full word score';

COMMENT ON COLUMN speaking_test_results.question_id IS 'Link to the specific speaking test question';

COMMENT ON COLUMN speaking_test_results.transcript IS 'Full transcript from speech-to-text service';
COMMENT ON COLUMN speaking_test_results.word_count IS 'Actual word count from transcript';
COMMENT ON COLUMN speaking_test_results.grammar_mistakes IS 'Number of grammar mistakes detected';
COMMENT ON COLUMN speaking_test_results.vocabulary_mistakes IS 'Number of vocabulary mistakes detected';
COMMENT ON COLUMN speaking_test_results.overall_score IS 'Final calculated score (0-100)';

-- ========================================
-- ADD MISSING SCORE COLUMNS
-- ========================================

-- Add missing score and max_score columns to match other test results
ALTER TABLE speaking_test_results 
ADD COLUMN IF NOT EXISTS score INTEGER,
ADD COLUMN IF NOT EXISTS max_score INTEGER DEFAULT 10;

-- Update existing records to set max_score = 10 and score = round(overall_score/10)
UPDATE speaking_test_results 
SET max_score = 10, 
    score = ROUND(overall_score/10)
WHERE score IS NULL OR max_score IS NULL;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Verify schema creation
SELECT 
    'Speaking test schema created successfully' as status,
    'All tables, functions, and indexes created' as message,
    'Automatic scoring system implemented' as scoring_system;

    ALTER TABLE speaking_test_results
  ADD COLUMN IF NOT EXISTS ai_feedback JSONB;

-- Optional index for teacher queries filtering by presence
CREATE INDEX IF NOT EXISTS idx_speaking_results_ai_feedback
  ON speaking_test_results USING GIN (ai_feedback);

-- ========================================
-- MIGRATION: Restore set_retest_offered to update ALL result tables
-- ========================================

CREATE OR REPLACE FUNCTION set_retest_offered(p_student_id text, p_test_id integer, p_flag boolean DEFAULT true)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE multiple_choice_test_results  SET retest_offered = p_flag WHERE student_id = p_student_id AND test_id = p_test_id;
  UPDATE true_false_test_results       SET retest_offered = p_flag WHERE student_id = p_student_id AND test_id = p_test_id;
  UPDATE input_test_results            SET retest_offered = p_flag WHERE student_id = p_student_id AND test_id = p_test_id;
  UPDATE matching_type_test_results    SET retest_offered = p_flag WHERE student_id = p_student_id AND test_id = p_test_id;
  UPDATE word_matching_test_results    SET retest_offered = p_flag WHERE student_id = p_student_id AND test_id = p_test_id;
  UPDATE drawing_test_results          SET retest_offered = p_flag WHERE student_id = p_student_id AND test_id = p_test_id;
  UPDATE fill_blanks_test_results      SET retest_offered = p_flag WHERE student_id = p_student_id AND test_id = p_test_id;
  UPDATE speaking_test_results         SET retest_offered = p_flag WHERE student_id = p_student_id AND test_id = p_test_id;
END;
$$;



-- 1. FIXED: Test performance view - Single dot per test
CREATE OR REPLACE VIEW test_performance_by_test AS
WITH all_test_results AS (
    -- Union all test result tables with test_type identifier
    SELECT 
        teacher_id, test_id, test_name, percentage, submitted_at, 
        academic_period_id, grade, class, student_id, 
        'multiple_choice' as test_type
    FROM multiple_choice_test_results 
    WHERE is_completed = true
    
    UNION ALL
    
    SELECT 
        teacher_id, test_id, test_name, percentage, submitted_at, 
        academic_period_id, grade, class, student_id, 
        'true_false' as test_type
    FROM true_false_test_results 
    WHERE is_completed = true
    
    UNION ALL
    
    SELECT 
        teacher_id, test_id, test_name, percentage, submitted_at, 
        academic_period_id, grade, class, student_id, 
        'input' as test_type
    FROM input_test_results 
    WHERE is_completed = true
    
    UNION ALL
    
    SELECT 
        teacher_id, test_id, test_name, percentage, submitted_at, 
        academic_period_id, grade, class, student_id, 
        'matching' as test_type
    FROM matching_type_test_results 
    WHERE is_completed = true
    
    UNION ALL
    
    SELECT 
        teacher_id, test_id, test_name, percentage, submitted_at, 
        academic_period_id, grade, class, student_id, 
        'word_matching' as test_type
    FROM word_matching_test_results 
    WHERE is_completed = true
    
    UNION ALL
    
    SELECT 
        teacher_id, test_id, test_name, percentage, submitted_at, 
        academic_period_id, grade, class, student_id, 
        'drawing' as test_type
    FROM drawing_test_results 
    WHERE is_completed = true
    
    UNION ALL
    
    SELECT 
        teacher_id, test_id, test_name, percentage, submitted_at, 
        academic_period_id, grade, class, student_id, 
        'fill_blanks' as test_type
    FROM fill_blanks_test_results 
    WHERE is_completed = true
    
    UNION ALL
    
    SELECT 
        teacher_id, test_id, test_name, percentage, submitted_at, 
        academic_period_id, grade, class, student_id, 
        'speaking' as test_type
    FROM speaking_test_results 
    WHERE is_completed = true
)
SELECT 
    teacher_id, 
    test_id, 
    test_name, 
    test_type,
    AVG(percentage) as average_score, 
    COUNT(DISTINCT student_id) as total_students,
    MIN(submitted_at) as submitted_at,  -- First submission date
    academic_period_id, 
    grade, 
    class
FROM all_test_results
GROUP BY 
    teacher_id, 
    test_id, 
    test_name, 
    test_type, 
    academic_period_id, 
    grade, 
    class
-- ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
-- KEY FIX: Group by test_id + test_type, NOT submitted_at!
-- This ensures exactly 1 dot per test regardless of student attempts
ORDER BY submitted_at ASC;

-- 2. Essential indexes for performance
CREATE INDEX IF NOT EXISTS idx_mc_results_teacher_period ON multiple_choice_test_results(teacher_id, academic_period_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_tf_results_teacher_period ON true_false_test_results(teacher_id, academic_period_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_input_results_teacher_period ON input_test_results(teacher_id, academic_period_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_matching_results_teacher_period ON matching_type_test_results(teacher_id, academic_period_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_word_matching_results_teacher_period ON word_matching_test_results(teacher_id, academic_period_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_drawing_results_teacher_period ON drawing_test_results(teacher_id, academic_period_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_fill_blanks_results_teacher_period ON fill_blanks_test_results(teacher_id, academic_period_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_speaking_results_teacher_period ON speaking_test_results(teacher_id, academic_period_id, submitted_at);

-- 3. Simple query to use in API
-- SELECT test_id, test_name, average_score, total_students, submitted_at
-- FROM test_performance_by_test
-- WHERE teacher_id = $1 AND academic_period_id = $2
-- ORDER BY submitted_at ASC;

-- That's it! No overengineering, just what we need for the graph.
-- ========================================
-- RETEST TARGETS SCHEMA UPDATE
-- Database-driven retest completion tracking
-- ========================================

-- Add new columns to retest_targets table
ALTER TABLE retest_targets
  ADD COLUMN IF NOT EXISTS max_attempts INTEGER,
  ADD COLUMN IF NOT EXISTS attempt_number INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS passed BOOLEAN DEFAULT FALSE;

-- Migrate existing data
-- Copy max_attempts from retest_assignments
UPDATE retest_targets rt
SET max_attempts = ra.max_attempts
FROM retest_assignments ra
WHERE rt.retest_assignment_id = ra.id
  AND rt.max_attempts IS NULL;

-- Set attempt_number = attempt_count for existing records
UPDATE retest_targets
SET attempt_number = attempt_count
WHERE attempt_number = 0 AND attempt_count > 0;

-- Set is_completed for existing completed retests
-- Completed if: attempts exhausted OR status = 'PASSED'
UPDATE retest_targets rt
SET is_completed = TRUE,
    completed_at = COALESCE(rt.last_attempt_at, rt.updated_at)
FROM retest_assignments ra
WHERE rt.retest_assignment_id = ra.id
  AND (
    (rt.attempt_count >= ra.max_attempts) OR
    (rt.status = 'PASSED')
  )
  AND rt.is_completed = FALSE;

-- Set passed flag based on status
UPDATE retest_targets
SET passed = TRUE
WHERE status = 'PASSED'
  AND passed = FALSE;

-- Fix any rows where attempt_number exceeds max_attempts
-- This can happen if max_attempts was changed after attempts were made
UPDATE retest_targets rt
SET attempt_number = ra.max_attempts
FROM retest_assignments ra
WHERE rt.retest_assignment_id = ra.id
  AND rt.attempt_number > ra.max_attempts
  AND ra.max_attempts IS NOT NULL;

-- Also fix attempt_count to match attempt_number
UPDATE retest_targets
SET attempt_count = attempt_number
WHERE attempt_count != attempt_number;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_retest_targets_is_completed 
  ON retest_targets(is_completed);
CREATE INDEX IF NOT EXISTS idx_retest_targets_passed 
  ON retest_targets(passed);
CREATE INDEX IF NOT EXISTS idx_retest_targets_completed_at 
  ON retest_targets(completed_at);
CREATE INDEX IF NOT EXISTS idx_retest_targets_attempt_number 
  ON retest_targets(attempt_number);
CREATE INDEX IF NOT EXISTS idx_retest_targets_max_attempts 
  ON retest_targets(max_attempts);

-- Add constraint to ensure attempt_number <= max_attempts (when both are set)
-- Note: Drop constraint first if it exists, then add it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_attempt_number_range' 
    AND conrelid = 'retest_targets'::regclass
  ) THEN
    ALTER TABLE retest_targets DROP CONSTRAINT chk_attempt_number_range;
  END IF;
END $$;

ALTER TABLE retest_targets
  ADD CONSTRAINT chk_attempt_number_range
  CHECK (max_attempts IS NULL OR attempt_number IS NULL OR attempt_number <= max_attempts);

-- Add comment for documentation
COMMENT ON COLUMN retest_targets.max_attempts IS 'Copied from retest_assignments.max_attempts for faster queries';
COMMENT ON COLUMN retest_targets.attempt_number IS 'Current attempt number (0 = not started, 1 = first attempt, etc.)';
COMMENT ON COLUMN retest_targets.is_completed IS 'TRUE when attempts exhausted OR student passed';
COMMENT ON COLUMN retest_targets.completed_at IS 'Timestamp when retest was completed';
COMMENT ON COLUMN retest_targets.passed IS 'TRUE if student passed (percentage >= passing_threshold)';

-- Add indexes on retest_assignment_id for all test results tables (if not already exist)
-- These indexes help with queries that filter by retest_assignment_id
CREATE INDEX IF NOT EXISTS idx_mc_results_retest_assignment_id 
  ON multiple_choice_test_results(retest_assignment_id);
CREATE INDEX IF NOT EXISTS idx_tf_results_retest_assignment_id 
  ON true_false_test_results(retest_assignment_id);
CREATE INDEX IF NOT EXISTS idx_input_results_retest_assignment_id 
  ON input_test_results(retest_assignment_id);
CREATE INDEX IF NOT EXISTS idx_matching_results_retest_assignment_id 
  ON matching_type_test_results(retest_assignment_id);
CREATE INDEX IF NOT EXISTS idx_word_matching_results_retest_assignment_id 
  ON word_matching_test_results(retest_assignment_id);
CREATE INDEX IF NOT EXISTS idx_drawing_results_retest_assignment_id 
  ON drawing_test_results(retest_assignment_id);
CREATE INDEX IF NOT EXISTS idx_fill_blanks_results_retest_assignment_id 
  ON fill_blanks_test_results(retest_assignment_id);
-- Speaking already has this index (idx_speaking_results_retest_assignment_id)

-- Verification query
SELECT 
  'retest_targets schema update completed' as status,
  COUNT(*) FILTER (WHERE max_attempts IS NOT NULL) as records_with_max_attempts,
  COUNT(*) FILTER (WHERE is_completed = TRUE) as completed_retests,
  COUNT(*) FILTER (WHERE passed = TRUE) as passed_retests
FROM retest_targets;

