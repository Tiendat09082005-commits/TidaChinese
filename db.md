-- ============================================================
--  汉语学习平台 — Database Schema  v2.0 (PostgreSQL)
--  Engine  : PostgreSQL 15+
--  Encoding: UTF8
--
--  Chuyển đổi từ MySQL 8.0:
--    • AUTO_INCREMENT       → GENERATED ALWAYS AS IDENTITY
--    • TINYINT              → SMALLINT  (PostgreSQL không có TINYINT)
--    • MEDIUMTEXT           → TEXT      (PostgreSQL dùng TEXT cho mọi kích thước)
--    • JSON                 → JSONB     (JSONB nhanh hơn, có thể index)
--    • ENUM(...)            → custom TYPE hoặc VARCHAR + CHECK
--    • ON UPDATE CURRENT_TIMESTAMP → trigger set_updated_at
--    • INDEX trong CREATE TABLE → tách ra CREATE INDEX riêng
--    • TIMESTAMP            → TIMESTAMPTZ (có timezone, an toàn hơn)
--    • CHAR(3)              → CHAR(3) / VARCHAR(3)
-- ============================================================

-- Bật extension nếu cần uuid
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TRIGGER FUNCTION dùng chung cho updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ENUM TYPES  (thay thế ENUM inline của MySQL)
-- ============================================================
CREATE TYPE vocab_status_enum      AS ENUM ('new', 'learning', 'review', 'mastered');
CREATE TYPE subscription_status_enum AS ENUM ('trial', 'active', 'expired', 'cancelled', 'paused');
CREATE TYPE wallet_tx_type_enum    AS ENUM ('topup', 'purchase', 'refund', 'bonus', 'expire');
CREATE TYPE payment_type_enum      AS ENUM ('subscription', 'coin_topup', 'course');
CREATE TYPE payment_status_enum    AS ENUM ('pending', 'success', 'failed', 'refunded');
CREATE TYPE refund_status_enum     AS ENUM ('pending', 'success', 'failed');
CREATE TYPE voucher_type_enum      AS ENUM ('percent', 'fixed_vnd', 'fixed_coin');
CREATE TYPE report_status_enum     AS ENUM ('pending', 'resolved', 'dismissed');

-- ============================================================
-- 1. USERS & AUTH
-- ============================================================

CREATE TABLE roles (
  id    SMALLINT PRIMARY KEY,
  name  VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE users (
  id                BIGINT      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  email             VARCHAR(255) NOT NULL UNIQUE,
  password_hash     VARCHAR(255) NOT NULL,
  display_name      VARCHAR(100),
  avatar_url        VARCHAR(500),
  role_id           SMALLINT    NOT NULL DEFAULT 1,
  hsk_goal_level    SMALLINT,
  daily_goal_min    SMALLINT    DEFAULT 15,
  learning_goal     VARCHAR(50),
  dialect_pref      VARCHAR(20)  DEFAULT 'beijing',
  font_size         SMALLINT    DEFAULT 2,
  dark_mode         BOOLEAN     DEFAULT FALSE,
  notify_time       TIME,
  streak_days       INT         DEFAULT 0,
  streak_last_at    DATE,
  is_active         BOOLEAN     DEFAULT TRUE,
  last_login_at     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE user_sessions (
  id          BIGINT      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id     BIGINT      NOT NULL,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  device_info VARCHAR(255),
  ip_address  VARCHAR(45),
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE admin_2fa (
  user_id     BIGINT      PRIMARY KEY,
  secret      VARCHAR(100) NOT NULL,
  is_enabled  BOOLEAN     DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  CONSTRAINT fk_2fa_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE admin_logs (
  id            BIGINT      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  admin_id      BIGINT      NOT NULL,
  action        VARCHAR(100) NOT NULL,
  target_table  VARCHAR(50),
  target_id     BIGINT,
  detail        JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_logs_admin FOREIGN KEY (admin_id) REFERENCES users(id)
);

-- ============================================================
-- 2. VOCABULARY
-- ============================================================

CREATE TABLE topics (
  id      SMALLINT    PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name_vi VARCHAR(50)  NOT NULL,
  name_zh VARCHAR(50),
  icon    VARCHAR(50)
);

CREATE TABLE word_types (
  id    SMALLINT    PRIMARY KEY,
  name  VARCHAR(20)
);

CREATE TABLE vocabulary (
  id                BIGINT      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  hanzi             VARCHAR(20)  NOT NULL,
  pinyin            VARCHAR(100),
  meaning_vi        TEXT         NOT NULL,
  meaning_en        TEXT,
  hsk_level         SMALLINT,
  word_type_id      SMALLINT,
  topic_id          SMALLINT,
  audio_male_url    VARCHAR(500),
  audio_female_url  VARCHAR(500),
  stroke_video_url  VARCHAR(500),
  stroke_grid_url   VARCHAR(500),
  stroke_count      SMALLINT,
  radical_id        SMALLINT,            -- FK thêm sau khi tạo radicals
  frequency_rank    INT,
  synonyms          JSONB,
  antonyms          JSONB,
  collocations      JSONB,
  is_published      BOOLEAN     DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_vocab_word_type FOREIGN KEY (word_type_id) REFERENCES word_types(id),
  CONSTRAINT fk_vocab_topic     FOREIGN KEY (topic_id)     REFERENCES topics(id)
);

CREATE INDEX idx_vocab_hsk   ON vocabulary (hsk_level);
CREATE INDEX idx_vocab_hanzi ON vocabulary (hanzi);

CREATE TRIGGER trg_vocabulary_updated_at
  BEFORE UPDATE ON vocabulary
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE vocabulary_examples (
  id              BIGINT      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  vocab_id        BIGINT      NOT NULL,
  sentence_zh     TEXT        NOT NULL,
  sentence_pinyin TEXT,
  sentence_vi     TEXT,
  audio_url       VARCHAR(500),
  sort_order      SMALLINT    DEFAULT 0,
  is_published    BOOLEAN     DEFAULT TRUE,
  CONSTRAINT fk_ve_vocab FOREIGN KEY (vocab_id) REFERENCES vocabulary(id) ON DELETE CASCADE
);

CREATE TABLE vocabulary_components (
  id                INT         PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  vocab_id          BIGINT      NOT NULL,
  component_hanzi   VARCHAR(5)  NOT NULL,
  component_meaning VARCHAR(100),
  sort_order        SMALLINT,
  CONSTRAINT fk_vc_vocab FOREIGN KEY (vocab_id) REFERENCES vocabulary(id)
);

-- ============================================================
-- 3. RADICALS
-- ============================================================

CREATE TABLE radicals (
  id                SMALLINT    PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  hanzi             VARCHAR(5)  NOT NULL UNIQUE,
  pinyin            VARCHAR(20),
  -- Phiên âm của bộ thủ (VD: mù, shuǐ, xīn) — đa số bộ thủ đọc được như 1 chữ độc lập
  name_vi           VARCHAR(50),
  meaning           VARCHAR(100),
  variant_form      VARCHAR(5),
  -- Dạng biến thể khi ghép chữ (VD: 水 đứng riêng, nhưng viết 氵 khi ở bên trái)
  audio_url         VARCHAR(500),
  -- Audio phát âm riêng của bộ thủ (người bản ngữ thu sẵn)
  stroke_count      SMALLINT,
  position          VARCHAR(20),
  story             TEXT,
  animation_url     VARCHAR(500),
  stroke_video_url  VARCHAR(500),
  is_simplified     BOOLEAN     DEFAULT TRUE,
  sort_order        SMALLINT
);

-- Thêm FK radical_id vào vocabulary sau khi radicals đã tồn tại
ALTER TABLE vocabulary
  ADD CONSTRAINT fk_vocab_radical FOREIGN KEY (radical_id) REFERENCES radicals(id);

CREATE TABLE radical_characters (
  radical_id  SMALLINT NOT NULL,
  vocab_id    BIGINT   NOT NULL,
  PRIMARY KEY (radical_id, vocab_id),
  CONSTRAINT fk_rc_radical FOREIGN KEY (radical_id) REFERENCES radicals(id),
  CONSTRAINT fk_rc_vocab   FOREIGN KEY (vocab_id)   REFERENCES vocabulary(id)
);

-- ============================================================
-- 4. STROKE ORDER
-- ============================================================

CREATE TABLE stroke_order (
  id            INT         PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  hanzi_char    VARCHAR(5)  NOT NULL UNIQUE,
  stroke_count  SMALLINT,
  svg_data      TEXT,                    -- MEDIUMTEXT → TEXT (PostgreSQL không giới hạn TEXT)
  video_url     VARCHAR(500),
  grid_img_url  VARCHAR(500)
);

-- ============================================================
-- 5. DECKS
-- ============================================================

CREATE TABLE decks (
  id           BIGINT      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  owner_id     BIGINT,
  name         VARCHAR(200) NOT NULL,
  description  TEXT,
  hsk_level    SMALLINT,
  topic_id     SMALLINT,
  is_system    BOOLEAN     DEFAULT FALSE,
  is_published BOOLEAN     DEFAULT TRUE,
  share_code   CHAR(8)     UNIQUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_decks_owner FOREIGN KEY (owner_id)  REFERENCES users(id),
  CONSTRAINT fk_decks_topic FOREIGN KEY (topic_id)  REFERENCES topics(id)
);

CREATE TRIGGER trg_decks_updated_at
  BEFORE UPDATE ON decks
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE deck_items (
  id         BIGINT  PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  deck_id    BIGINT  NOT NULL,
  vocab_id   BIGINT  NOT NULL,
  sort_order INT     DEFAULT 0,
  UNIQUE (deck_id, vocab_id),
  CONSTRAINT fk_di_deck  FOREIGN KEY (deck_id)  REFERENCES decks(id) ON DELETE CASCADE,
  CONSTRAINT fk_di_vocab FOREIGN KEY (vocab_id) REFERENCES vocabulary(id)
);

-- ============================================================
-- 6. FLASHCARD SRS
-- ============================================================

CREATE TABLE user_vocab_progress (
  id            BIGINT             PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id       BIGINT             NOT NULL,
  vocab_id      BIGINT             NOT NULL,
  deck_id       BIGINT,
  ease_factor   REAL               DEFAULT 2.5,   -- FLOAT → REAL
  interval_days INT                DEFAULT 1,
  repetitions   INT                DEFAULT 0,
  due_date      DATE,
  last_score    SMALLINT,
  review_count  INT                DEFAULT 0,
  is_favorite   BOOLEAN            DEFAULT FALSE,
  status        vocab_status_enum  DEFAULT 'new',
  UNIQUE (user_id, vocab_id, deck_id),
  CONSTRAINT fk_uvp_user  FOREIGN KEY (user_id)  REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_uvp_vocab FOREIGN KEY (vocab_id) REFERENCES vocabulary(id),
  CONSTRAINT fk_uvp_deck  FOREIGN KEY (deck_id)  REFERENCES decks(id)
);

CREATE INDEX idx_uvp_due ON user_vocab_progress (user_id, due_date);

CREATE TABLE flashcard_sessions (
  id            BIGINT      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id       BIGINT      NOT NULL,
  deck_id       BIGINT,
  mode          VARCHAR(30),
  total_cards   INT,
  correct_count INT         DEFAULT 0,
  duration_sec  INT,
  started_at    TIMESTAMPTZ,
  ended_at      TIMESTAMPTZ,
  CONSTRAINT fk_fs_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_fs_deck FOREIGN KEY (deck_id) REFERENCES decks(id)
);

CREATE TABLE flashcard_reviews (
  id          BIGINT      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  session_id  BIGINT      NOT NULL,
  vocab_id    BIGINT      NOT NULL,
  score       SMALLINT    NOT NULL,
  response_ms INT,
  reviewed_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_fr_session FOREIGN KEY (session_id) REFERENCES flashcard_sessions(id),
  CONSTRAINT fk_fr_vocab   FOREIGN KEY (vocab_id)   REFERENCES vocabulary(id)
);

-- ============================================================
-- 7. GRAMMAR
-- ============================================================

CREATE TABLE grammar_points (
  id           INT         PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title_vi     VARCHAR(200) NOT NULL,
  title_zh     VARCHAR(200),
  formula      VARCHAR(500),
  explanation  TEXT,
  hsk_level    SMALLINT,
  category     VARCHAR(50),
  sort_order   INT         DEFAULT 0,
  is_published BOOLEAN     DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE grammar_examples (
  id              INT         PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  grammar_id      INT         NOT NULL,
  sentence_zh     TEXT        NOT NULL,
  sentence_pinyin TEXT,
  sentence_vi     TEXT,
  audio_url       VARCHAR(500),
  sort_order      SMALLINT,
  CONSTRAINT fk_ge_grammar FOREIGN KEY (grammar_id) REFERENCES grammar_points(id) ON DELETE CASCADE
);

CREATE TABLE grammar_exercises (
  id          INT         PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  grammar_id  INT,
  type        VARCHAR(30),
  question_zh TEXT,
  options     JSONB,
  answer      TEXT        NOT NULL,
  explanation TEXT,
  difficulty  SMALLINT    DEFAULT 2,
  CONSTRAINT fk_gex_grammar FOREIGN KEY (grammar_id) REFERENCES grammar_points(id)
);

CREATE TABLE user_grammar_progress (
  user_id    BIGINT      NOT NULL,
  grammar_id INT         NOT NULL,
  score      SMALLINT    DEFAULT 0,
  attempts   INT         DEFAULT 0,
  last_at    TIMESTAMPTZ,
  PRIMARY KEY (user_id, grammar_id),
  CONSTRAINT fk_ugp_user    FOREIGN KEY (user_id)    REFERENCES users(id),
  CONSTRAINT fk_ugp_grammar FOREIGN KEY (grammar_id) REFERENCES grammar_points(id)
);

-- ============================================================
-- 8. LISTENING
-- ============================================================

CREATE TABLE listening_items (
  id            INT         PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title         VARCHAR(200) NOT NULL,
  type          VARCHAR(20),
  hsk_level     SMALLINT,
  topic_id      SMALLINT,
  audio_url     VARCHAR(500),
  video_url     VARCHAR(500),
  transcript_zh TEXT,
  transcript_vi TEXT,
  duration_sec  INT,
  is_published  BOOLEAN     DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_li_topic FOREIGN KEY (topic_id) REFERENCES topics(id)
);

CREATE TABLE listening_questions (
  id           INT         PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  listening_id INT         NOT NULL,
  question_vi  TEXT        NOT NULL,
  options      JSONB,
  answer       VARCHAR(5),
  explanation  TEXT,
  sort_order   SMALLINT,
  CONSTRAINT fk_lq_listening FOREIGN KEY (listening_id) REFERENCES listening_items(id) ON DELETE CASCADE
);

CREATE TABLE user_listening_progress (
  user_id        BIGINT      NOT NULL,
  listening_id   INT         NOT NULL,
  completed      BOOLEAN     DEFAULT FALSE,
  score          SMALLINT,
  dictation_text TEXT,
  last_at        TIMESTAMPTZ,
  PRIMARY KEY (user_id, listening_id),
  CONSTRAINT fk_ulp_user      FOREIGN KEY (user_id)      REFERENCES users(id),
  CONSTRAINT fk_ulp_listening FOREIGN KEY (listening_id) REFERENCES listening_items(id)
);

-- ============================================================
-- 9. READING
-- ============================================================

CREATE TABLE reading_articles (
  id           INT         PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title_zh     VARCHAR(300),
  title_vi     VARCHAR(300),
  content_zh   TEXT        NOT NULL,   -- MEDIUMTEXT → TEXT
  content_vi   TEXT,
  type         VARCHAR(20),
  hsk_level    SMALLINT,
  topic_id     SMALLINT,
  word_count   INT,
  is_published BOOLEAN     DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_ra_topic FOREIGN KEY (topic_id) REFERENCES topics(id)
);

CREATE TABLE reading_questions (
  id          INT         PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  article_id  INT         NOT NULL,
  question_vi TEXT        NOT NULL,
  options     JSONB,
  answer      VARCHAR(5),
  explanation TEXT,
  sort_order  SMALLINT,
  CONSTRAINT fk_rq_article FOREIGN KEY (article_id) REFERENCES reading_articles(id) ON DELETE CASCADE
);

CREATE TABLE article_vocab_tags (
  article_id  INT    NOT NULL,
  vocab_id    BIGINT NOT NULL,
  position    INT,
  PRIMARY KEY (article_id, vocab_id),
  CONSTRAINT fk_avt_article FOREIGN KEY (article_id) REFERENCES reading_articles(id),
  CONSTRAINT fk_avt_vocab   FOREIGN KEY (vocab_id)   REFERENCES vocabulary(id)
);

CREATE TABLE user_reading_progress (
  user_id    BIGINT      NOT NULL,
  article_id INT         NOT NULL,
  completed  BOOLEAN     DEFAULT FALSE,
  score      SMALLINT,
  last_at    TIMESTAMPTZ,
  PRIMARY KEY (user_id, article_id),
  CONSTRAINT fk_urp_user    FOREIGN KEY (user_id)    REFERENCES users(id),
  CONSTRAINT fk_urp_article FOREIGN KEY (article_id) REFERENCES reading_articles(id)
);

-- ============================================================
-- 10. WRITING
-- ============================================================

CREATE TABLE writing_prompts (
  id           INT      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  type         VARCHAR(20),
  hsk_level    SMALLINT,
  prompt_vi    TEXT,
  prompt_zh    TEXT,
  keywords     JSONB,
  rubric       JSONB,
  is_published BOOLEAN  DEFAULT TRUE
);

CREATE TABLE user_writing_entries (
  id          BIGINT      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id     BIGINT      NOT NULL,
  prompt_id   INT,
  type        VARCHAR(20),
  content_zh  TEXT        NOT NULL,
  ai_feedback TEXT,
  ai_score    SMALLINT,
  corrections JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_uwe_user   FOREIGN KEY (user_id)   REFERENCES users(id),
  CONSTRAINT fk_uwe_prompt FOREIGN KEY (prompt_id) REFERENCES writing_prompts(id)
);

-- ============================================================
-- 11. SPEAKING
-- ============================================================

CREATE TABLE speaking_scenarios (
  id               INT         PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title_vi         VARCHAR(200),
  description      TEXT,
  hsk_level        SMALLINT,
  topic_id         SMALLINT,
  ai_system_prompt TEXT,
  is_published     BOOLEAN     DEFAULT TRUE,
  CONSTRAINT fk_ss_topic FOREIGN KEY (topic_id) REFERENCES topics(id)
);

CREATE TABLE user_speaking_sessions (
  id           BIGINT      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id      BIGINT      NOT NULL,
  scenario_id  INT,
  type         VARCHAR(20),
  transcript   JSONB,
  avg_score    SMALLINT,
  duration_sec INT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_uss_user     FOREIGN KEY (user_id)     REFERENCES users(id),
  CONSTRAINT fk_uss_scenario FOREIGN KEY (scenario_id) REFERENCES speaking_scenarios(id)
);

CREATE TABLE pronunciation_records (
  id         BIGINT      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id    BIGINT      NOT NULL,
  vocab_id   BIGINT,
  audio_url  VARCHAR(500),
  score      SMALLINT,
  tone_score SMALLINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_pr_user  FOREIGN KEY (user_id)  REFERENCES users(id),
  CONSTRAINT fk_pr_vocab FOREIGN KEY (vocab_id) REFERENCES vocabulary(id)
);

-- ============================================================
-- 12. HSK EXAMS
-- ============================================================

CREATE TABLE exams (
  id            INT         PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title         VARCHAR(200) NOT NULL,
  hsk_level     SMALLINT    NOT NULL,
  type          VARCHAR(20),
  duration_min  SMALLINT,
  total_score   SMALLINT    DEFAULT 300,
  passing_score SMALLINT    DEFAULT 180,
  is_random     BOOLEAN     DEFAULT FALSE,
  is_published  BOOLEAN     DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE exam_questions (
  id          BIGINT      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  exam_id     INT,
  skill       VARCHAR(10),
  type        VARCHAR(20),
  question_zh TEXT,
  audio_url   VARCHAR(500),
  options     JSONB,
  answer      TEXT,
  explanation TEXT,
  hsk_level   SMALLINT,
  difficulty  SMALLINT    DEFAULT 2,
  sort_order  INT,
  CONSTRAINT fk_eq_exam FOREIGN KEY (exam_id) REFERENCES exams(id)
);

CREATE TABLE user_exam_attempts (
  id              BIGINT      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id         BIGINT      NOT NULL,
  exam_id         INT         NOT NULL,
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  duration_sec    INT,
  listening_score SMALLINT,
  reading_score   SMALLINT,
  writing_score   SMALLINT,
  total_score     SMALLINT,
  is_passed       BOOLEAN,
  CONSTRAINT fk_uea_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_uea_exam FOREIGN KEY (exam_id) REFERENCES exams(id)
);

CREATE TABLE user_exam_answers (
  id          BIGINT   PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  attempt_id  BIGINT   NOT NULL,
  question_id BIGINT   NOT NULL,
  user_answer TEXT,
  is_correct  BOOLEAN,
  score       SMALLINT,
  CONSTRAINT fk_ueans_attempt  FOREIGN KEY (attempt_id)  REFERENCES user_exam_attempts(id),
  CONSTRAINT fk_ueans_question FOREIGN KEY (question_id) REFERENCES exam_questions(id)
);

-- ============================================================
-- 13. SENTENCE PATTERNS & IDIOMS
-- ============================================================

CREATE TABLE sentence_patterns (
  id           INT         PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  formula      VARCHAR(300) NOT NULL,
  explanation  TEXT,
  grammar_id   INT,
  hsk_level    SMALLINT,
  is_published BOOLEAN     DEFAULT TRUE,
  CONSTRAINT fk_sp_grammar FOREIGN KEY (grammar_id) REFERENCES grammar_points(id)
);

CREATE TABLE idioms (
  id           INT         PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  hanzi        VARCHAR(20)  NOT NULL,
  pinyin       VARCHAR(100),
  literal_vi   TEXT,
  meaning_vi   TEXT        NOT NULL,
  story        TEXT,
  example_zh   TEXT,
  example_vi   TEXT,
  audio_url    VARCHAR(500),
  hsk_level    SMALLINT,
  popularity   SMALLINT    DEFAULT 3,
  topic_id     SMALLINT,
  is_published BOOLEAN     DEFAULT TRUE,
  CONSTRAINT fk_idioms_topic FOREIGN KEY (topic_id) REFERENCES topics(id)
);

-- ============================================================
-- 14. SEARCH & FAVORITES
-- ============================================================

CREATE TABLE search_history (
  id          BIGINT      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id     BIGINT      NOT NULL,
  query       VARCHAR(100) NOT NULL,
  vocab_id    BIGINT,
  searched_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_sh_user  FOREIGN KEY (user_id)  REFERENCES users(id),
  CONSTRAINT fk_sh_vocab FOREIGN KEY (vocab_id) REFERENCES vocabulary(id)
);

CREATE INDEX idx_search_history ON search_history (user_id, searched_at DESC);

CREATE TABLE user_favorites (
  user_id    BIGINT      NOT NULL,
  vocab_id   BIGINT      NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, vocab_id),
  CONSTRAINT fk_uf_user  FOREIGN KEY (user_id)  REFERENCES users(id),
  CONSTRAINT fk_uf_vocab FOREIGN KEY (vocab_id) REFERENCES vocabulary(id)
);

-- ============================================================
-- 15. DAILY STATS
-- ============================================================

CREATE TABLE user_daily_stats (
  id             BIGINT   PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id        BIGINT   NOT NULL,
  date           DATE     NOT NULL,
  study_min      INT      DEFAULT 0,
  cards_reviewed INT      DEFAULT 0,
  cards_correct  INT      DEFAULT 0,
  new_words      INT      DEFAULT 0,
  listening_min  INT      DEFAULT 0,
  speaking_min   INT      DEFAULT 0,
  reading_min    INT      DEFAULT 0,
  writing_min    INT      DEFAULT 0,
  UNIQUE (user_id, date),
  CONSTRAINT fk_uds_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================================
-- 16. NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id            BIGINT      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  creator_id    BIGINT,
  type          VARCHAR(20),
  title         VARCHAR(200),
  body          TEXT,
  target        VARCHAR(20)  DEFAULT 'all',
  target_filter JSONB,
  scheduled_at  TIMESTAMPTZ,
  sent_at       TIMESTAMPTZ,
  status        VARCHAR(20)  DEFAULT 'draft',
  CONSTRAINT fk_notif_creator FOREIGN KEY (creator_id) REFERENCES users(id)
);

CREATE TABLE user_notifications (
  id              BIGINT      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id         BIGINT      NOT NULL,
  notification_id BIGINT,
  is_read         BOOLEAN     DEFAULT FALSE,
  read_at         TIMESTAMPTZ,
  CONSTRAINT fk_un_user   FOREIGN KEY (user_id)         REFERENCES users(id),
  CONSTRAINT fk_un_notif  FOREIGN KEY (notification_id) REFERENCES notifications(id)
);

-- ============================================================
-- 17. CONTENT REPORTS
-- ============================================================

CREATE TABLE content_reports (
  id           BIGINT             PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  reporter_id  BIGINT             NOT NULL,
  target_type  VARCHAR(20),
  target_id    BIGINT             NOT NULL,
  reason       VARCHAR(100),
  detail       TEXT,
  status       report_status_enum DEFAULT 'pending',
  resolved_by  BIGINT,
  resolved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ        DEFAULT NOW(),
  CONSTRAINT fk_cr_reporter FOREIGN KEY (reporter_id) REFERENCES users(id),
  CONSTRAINT fk_cr_resolver FOREIGN KEY (resolved_by) REFERENCES users(id)
);

-- ============================================================
-- 18. MEDIA ASSETS
-- ============================================================

CREATE TABLE media_assets (
  id           BIGINT      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  uploader_id  BIGINT,
  type         VARCHAR(20),
  url          VARCHAR(500) NOT NULL,
  filename     VARCHAR(300),
  file_size    INT,
  duration_sec INT,
  ref_type     VARCHAR(20),
  ref_id       BIGINT,
  is_verified  BOOLEAN     DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_ma_uploader FOREIGN KEY (uploader_id) REFERENCES users(id)
);

-- ============================================================
-- 19. PLANS & SUBSCRIPTION
-- ============================================================

CREATE TABLE plans (
  id            SMALLINT    PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name          VARCHAR(50)  NOT NULL,
  price         DECIMAL(10,2) NOT NULL,
  currency      CHAR(3)     DEFAULT 'VND',
  duration_days SMALLINT    NOT NULL,
  discount_pct  SMALLINT    DEFAULT 0,
  is_trial      BOOLEAN     DEFAULT FALSE,
  trial_days    SMALLINT    DEFAULT 0,
  features      JSONB,
  is_active     BOOLEAN     DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_subscriptions (
  id           BIGINT                   PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id      BIGINT                   NOT NULL,
  plan_id      SMALLINT                 NOT NULL,
  status       subscription_status_enum DEFAULT 'trial',
  started_at   TIMESTAMPTZ              NOT NULL,
  expires_at   TIMESTAMPTZ              NOT NULL,
  cancelled_at TIMESTAMPTZ,
  auto_renew   BOOLEAN                  DEFAULT TRUE,
  payment_id   BIGINT,                  -- FK thêm sau khi có bảng payments
  created_at   TIMESTAMPTZ              DEFAULT NOW(),
  CONSTRAINT fk_us_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_us_plan FOREIGN KEY (plan_id) REFERENCES plans(id)
);

CREATE TABLE user_trial_usage (
  user_id    BIGINT      PRIMARY KEY,
  used_at    TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT fk_utu_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================================
-- 20. WALLET & COIN
-- ============================================================

CREATE TABLE coin_packages (
  id          SMALLINT      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name        VARCHAR(50),
  price       DECIMAL(10,2) NOT NULL,
  coin_amount INT           NOT NULL,
  bonus_coin  INT           DEFAULT 0,
  is_popular  BOOLEAN       DEFAULT FALSE,
  is_active   BOOLEAN       DEFAULT TRUE
);

CREATE TABLE user_wallets (
  user_id      BIGINT      PRIMARY KEY,
  balance_coin INT         DEFAULT 0,
  total_earned INT         DEFAULT 0,
  total_spent  INT         DEFAULT 0,
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_uw_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Trigger tự cập nhật updated_at cho user_wallets
CREATE TRIGGER trg_wallets_updated_at
  BEFORE UPDATE ON user_wallets
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE wallet_transactions (
  id            BIGINT              PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id       BIGINT              NOT NULL,
  type          wallet_tx_type_enum NOT NULL,
  amount        INT                 NOT NULL,
  balance_after INT                 NOT NULL,
  ref_type      VARCHAR(30),
  ref_id        BIGINT,
  note          VARCHAR(200),
  created_at    TIMESTAMPTZ         DEFAULT NOW(),
  CONSTRAINT fk_wt_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================================
-- 21. COURSES & CONTENT LOCK
-- ============================================================

CREATE TABLE courses (
  id            INT           PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title_vi      VARCHAR(200)  NOT NULL,
  description   TEXT,
  hsk_level     SMALLINT,
  price_coin    INT           NOT NULL,
  price_vnd     DECIMAL(10,2),
  thumbnail_url VARCHAR(500),
  total_lessons SMALLINT      DEFAULT 0,
  is_published  BOOLEAN       DEFAULT TRUE,
  created_at    TIMESTAMPTZ   DEFAULT NOW()
);

CREATE TABLE user_courses (
  user_id      BIGINT         NOT NULL,
  course_id    INT            NOT NULL,
  purchased_at TIMESTAMPTZ    DEFAULT NOW(),
  payment_id   BIGINT,        -- FK thêm sau khi có bảng payments
  price_paid   DECIMAL(10,2),
  PRIMARY KEY (user_id, course_id),
  CONSTRAINT fk_uc_user   FOREIGN KEY (user_id)   REFERENCES users(id),
  CONSTRAINT fk_uc_course FOREIGN KEY (course_id) REFERENCES courses(id)
);

CREATE TABLE content_access_rules (
  id             INT         PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  content_type   VARCHAR(30)  NOT NULL,
  content_id     BIGINT,
  require_plan   BOOLEAN     DEFAULT TRUE,
  require_course INT,
  min_hsk_free   SMALLINT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_car_course FOREIGN KEY (require_course) REFERENCES courses(id)
);

-- ============================================================
-- 22. PAYMENTS
-- ============================================================

CREATE TABLE payments (
  id             BIGINT               PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id        BIGINT               NOT NULL,
  type           payment_type_enum    NOT NULL,
  ref_id         BIGINT,
  amount         DECIMAL(10,2)        NOT NULL,
  currency       CHAR(3)              DEFAULT 'VND',
  gateway        VARCHAR(20),
  gateway_txn_id VARCHAR(100),
  gateway_raw    JSONB,
  status         payment_status_enum  DEFAULT 'pending',
  paid_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ          DEFAULT NOW(),
  CONSTRAINT fk_pay_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Thêm FK payment_id vào user_subscriptions và user_courses
ALTER TABLE user_subscriptions
  ADD CONSTRAINT fk_us_payment FOREIGN KEY (payment_id) REFERENCES payments(id);

ALTER TABLE user_courses
  ADD CONSTRAINT fk_uc_payment FOREIGN KEY (payment_id) REFERENCES payments(id);

CREATE TABLE refunds (
  id                BIGINT              PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  payment_id        BIGINT              NOT NULL,
  admin_id          BIGINT              NOT NULL,
  amount            DECIMAL(10,2)       NOT NULL,
  reason            TEXT,
  gateway_refund_id VARCHAR(100),
  status            refund_status_enum  DEFAULT 'pending',
  created_at        TIMESTAMPTZ         DEFAULT NOW(),
  CONSTRAINT fk_ref_payment FOREIGN KEY (payment_id) REFERENCES payments(id),
  CONSTRAINT fk_ref_admin   FOREIGN KEY (admin_id)   REFERENCES users(id)
);

CREATE TABLE vouchers (
  id          INT                PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  code        VARCHAR(20)        NOT NULL UNIQUE,
  type        voucher_type_enum  NOT NULL,
  value       DECIMAL(10,2)      NOT NULL,
  apply_to    VARCHAR(20)        DEFAULT 'all',
  max_uses    INT,
  used_count  INT                DEFAULT 0,
  valid_from  TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  is_active   BOOLEAN            DEFAULT TRUE,
  created_at  TIMESTAMPTZ        DEFAULT NOW()
);

CREATE TABLE voucher_usages (
  id              BIGINT        PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  voucher_id      INT           NOT NULL,
  user_id         BIGINT        NOT NULL,
  payment_id      BIGINT        NOT NULL,
  discount_amount DECIMAL(10,2),
  used_at         TIMESTAMPTZ   DEFAULT NOW(),
  UNIQUE (voucher_id, user_id),
  CONSTRAINT fk_vu_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers(id),
  CONSTRAINT fk_vu_user    FOREIGN KEY (user_id)    REFERENCES users(id),
  CONSTRAINT fk_vu_payment FOREIGN KEY (payment_id) REFERENCES payments(id)
);

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO roles (id, name) VALUES
  (1, 'user'), (2, 'teacher'), (3, 'admin'), (4, 'superadmin');

INSERT INTO word_types (id, name) VALUES
  (1,'danh từ'),(2,'động từ'),(3,'tính từ'),
  (4,'phó từ'),(5,'giới từ'),(6,'liên từ'),
  (7,'thán từ'),(8,'lượng từ'),(9,'đại từ');

INSERT INTO topics (name_vi, name_zh) VALUES
  ('Gia đình','家庭'),('Du lịch','旅游'),('Ăn uống','饮食'),
  ('Công việc','工作'),('Mua sắm','购物'),('Y tế','医疗'),
  ('Học tập','学习'),('Giao tiếp','日常交流'),
  ('Thể thao','体育'),('Môi trường','环境');

INSERT INTO plans (name, price, duration_days, is_trial, trial_days, features) VALUES
  ('Free Trial',      0,       7,   TRUE,  7,  '{"ai_chat":false,"hsk_exam":true,"max_decks":3,"all_content":true}'),
  ('Premium Monthly', 99000,   30,  FALSE, 0,  '{"ai_chat":true,"hsk_exam":true,"max_decks":999,"all_content":true}'),
  ('Premium Yearly',  799000,  365, FALSE, 0,  '{"ai_chat":true,"hsk_exam":true,"max_decks":999,"all_content":true}');

INSERT INTO coin_packages (name, price, coin_amount, bonus_coin, is_popular) VALUES
  ('Gói Nhỏ',  50000,  55,  0,   FALSE),
  ('Gói Vừa',  100000, 120, 10,  FALSE),
  ('Gói Lớn',  200000, 260, 30,  TRUE),
  ('Gói Siêu', 500000, 700, 100, FALSE);

INSERT INTO content_access_rules (content_type, content_id, require_plan, min_hsk_free) VALUES
  ('vocab',     NULL, TRUE, NULL),
  ('deck',      NULL, TRUE, NULL),
  ('grammar',   NULL, TRUE, NULL),
  ('listening', NULL, TRUE, NULL),
  ('speaking',  NULL, TRUE, NULL),
  ('writing',   NULL, TRUE, NULL),
  ('exam',      NULL, TRUE, NULL);

-- ============================================================
-- THÊM INDEX JSONB (tối ưu truy vấn JSONB)
-- ============================================================
CREATE INDEX idx_vocab_synonyms    ON vocabulary USING GIN (synonyms);
CREATE INDEX idx_vocab_collocations ON vocabulary USING GIN (collocations);
CREATE INDEX idx_admin_logs_detail  ON admin_logs USING GIN (detail);
CREATE INDEX idx_plans_features     ON plans      USING GIN (features);
CREATE INDEX idx_notif_filter       ON notifications USING GIN (target_filter);
CREATE INDEX idx_gateway_raw        ON payments   USING GIN (gateway_raw);