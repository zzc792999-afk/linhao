export const campusSchema = [
  'CREATE TABLE IF NOT EXISTS class_marquee(id TEXT PRIMARY KEY, text TEXT NOT NULL, author TEXT NOT NULL, date TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS class_teachers(id TEXT PRIMARY KEY, name TEXT NOT NULL, subject TEXT NOT NULL, date TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS class_teacher_reviews(id TEXT PRIMARY KEY, teacher_id TEXT NOT NULL, owner TEXT NOT NULL, nickname TEXT NOT NULL, rating INTEGER NOT NULL DEFAULT 5, tag TEXT NOT NULL DEFAULT \'\', content TEXT NOT NULL, date TEXT NOT NULL)',
  'CREATE INDEX IF NOT EXISTS class_teacher_reviews_tid ON class_teacher_reviews(teacher_id, date DESC)',
  'CREATE TABLE IF NOT EXISTS class_targets(id TEXT PRIMARY KEY, owner TEXT NOT NULL, title TEXT NOT NULL, date TEXT NOT NULL, data BYTEA NOT NULL, throws_count INTEGER NOT NULL DEFAULT 0)',
  'CREATE TABLE IF NOT EXISTS class_target_splats(id TEXT PRIMARY KEY, target_id TEXT NOT NULL, item TEXT NOT NULL, x REAL NOT NULL, y REAL NOT NULL, date TEXT NOT NULL)',
  'CREATE INDEX IF NOT EXISTS class_target_splats_tid ON class_target_splats(target_id, date ASC)',
  `INSERT INTO class_teachers(id, name, subject, date) VALUES('t-math', '张老师', '高等数学', '2026-10-30T00:00:00.000Z') ON CONFLICT(id) DO NOTHING`,
  `INSERT INTO class_teachers(id, name, subject, date) VALUES('t-ds', '李老师', '数据结构与算法', '2026-10-30T00:00:00.000Z') ON CONFLICT(id) DO NOTHING`,
  `INSERT INTO class_teachers(id, name, subject, date) VALUES('t-py', '王老师', 'Python程序设计', '2026-10-30T00:00:00.000Z') ON CONFLICT(id) DO NOTHING`,
  `INSERT INTO class_marquee(id, text, author, date) VALUES('m-welcome', '欢迎来到 25计算机1 班级互动小站！代码改变世界，青春共同书写。', '班委', '2026-10-30T00:00:00.000Z') ON CONFLICT(id) DO NOTHING`
];

export function campusStore(query) {
  const rows = async (sql, args = []) => (await query(sql, args)).rows;

  return {
    // 1. 网站滚动墙 (Marquee)
    marqueeMessages: async () => rows('SELECT id, text, author, date FROM class_marquee ORDER BY date DESC LIMIT 20'),
    addMarquee: async p => !!(await query(
      'INSERT INTO class_marquee(id, text, author, date) SELECT $1, $2, $3, $4 WHERE (SELECT COUNT(*) FROM class_marquee) < 50',
      [p.id, p.text, p.author, p.date]
    )).rowCount,
    deleteMarquee: async id => !!(await query('DELETE FROM class_marquee WHERE id=$1', [id])).rowCount,

    // 2. 各老师匿名评价基地 (Teacher Reviews)
    teachers: async () => {
      const list = await rows(
        'SELECT t.id, t.name, t.subject, t.date, ' +
        '(SELECT COUNT(*) FROM class_teacher_reviews r WHERE r.teacher_id=t.id) AS review_count, ' +
        '(SELECT COALESCE(ROUND(AVG(r.rating), 1), 5.0) FROM class_teacher_reviews r WHERE r.teacher_id=t.id) AS avg_rating ' +
        'FROM class_teachers t ORDER BY t.date ASC, t.id ASC'
      );
      return list.map(t => ({
        ...t,
        review_count: Number(t.review_count || 0),
        avg_rating: Number(t.avg_rating || 5)
      }));
    },
    teacher: async id => (await rows('SELECT id, name, subject, date FROM class_teachers WHERE id=$1', [id]))[0],
    addTeacher: async p => !!(await query(
      'INSERT INTO class_teachers(id, name, subject, date) SELECT $1, $2, $3, $4 WHERE (SELECT COUNT(*) FROM class_teachers) < 50',
      [p.id, p.name, p.subject, p.date]
    )).rowCount,
    deleteTeacher: async id => {
      await query('DELETE FROM class_teacher_reviews WHERE teacher_id=$1', [id]);
      return !!(await query('DELETE FROM class_teachers WHERE id=$1', [id])).rowCount;
    },
    teacherReviews: async (teacherId, owner) => {
      const list = await rows(
        'SELECT r.id, r.teacher_id, r.nickname, r.rating, r.tag, r.content, r.date, ' +
        'CASE WHEN r.owner=$2 THEN 1 ELSE 0 END AS mine ' +
        'FROM class_teacher_reviews r WHERE r.teacher_id=$1 ORDER BY r.date DESC LIMIT 100',
        [teacherId, owner]
      );
      return list.map(r => ({
        ...r,
        rating: Number(r.rating || 5),
        mine: !!r.mine
      }));
    },
    addTeacherReview: async p => !!(await query(
      'INSERT INTO class_teacher_reviews(id, teacher_id, owner, nickname, rating, tag, content, date) ' +
      'SELECT $1, $2, $3, $4, $5, $6, $7, $8 ' +
      'WHERE (SELECT COUNT(*) FROM class_teachers WHERE id=$2) > 0 ' +
      'AND (SELECT COUNT(*) FROM class_teacher_reviews WHERE teacher_id=$2) < 200 ' +
      'AND (SELECT COUNT(*) FROM class_teacher_reviews WHERE teacher_id=$2 AND owner=$3) < 10',
      [p.id, p.teacherId, p.owner, p.nickname, p.rating, p.tag, p.content, p.date]
    )).rowCount,
    deleteTeacherReview: async (id, owner) => {
      const clause = owner === undefined ? '' : ' AND owner=$2';
      return !!(await query(`DELETE FROM class_teacher_reviews WHERE id=$1${clause}`, owner === undefined ? [id] : [id, owner])).rowCount;
    },
    adminAllTeacherReviews: async () => {
      const list = await rows(
        'SELECT r.id, r.teacher_id, COALESCE(t.name, \'未知老师\') AS teacher_name, r.nickname, r.rating, r.tag, r.content, r.date ' +
        'FROM class_teacher_reviews r LEFT JOIN class_teachers t ON t.id=r.teacher_id ORDER BY r.date DESC LIMIT 100'
      );
      return list.map(r => ({ ...r, rating: Number(r.rating || 5) }));
    },

    // 3. 趣味扔物靶场 (Throwing Targets Arena)
    targets: async owner => {
      const list = await rows(
        'SELECT t.id, t.title, t.date, t.throws_count, ' +
        'CASE WHEN t.owner=$1 THEN 1 ELSE 0 END AS mine ' +
        'FROM class_targets t ORDER BY t.date DESC, t.id DESC LIMIT 40',
        [owner]
      );
      return list.map(t => ({
        ...t,
        throws_count: Number(t.throws_count || 0),
        mine: !!t.mine
      }));
    },
    targetImage: async id => {
      const row = (await rows('SELECT data FROM class_targets WHERE id=$1', [id]))[0];
      return row ? Buffer.from(row.data) : null;
    },
    targetSplats: async targetId => {
      const splats = await rows(
        'SELECT id, item, x, y, date FROM class_target_splats WHERE target_id=$1 ORDER BY date ASC, id ASC LIMIT 150',
        [targetId]
      );
      return splats.map(s => ({
        id: s.id,
        item: s.item,
        x: Number(s.x),
        y: Number(s.y),
        date: s.date
      }));
    },
    targetItemCounts: async targetId => {
      const counts = await rows('SELECT item, COUNT(*) AS count FROM class_target_splats WHERE target_id=$1 GROUP BY item', [targetId]);
      return Object.fromEntries(counts.map(c => [c.item, Number(c.count)]));
    },
    addTarget: async p => !!(await query(
      'INSERT INTO class_targets(id, owner, title, date, data, throws_count) ' +
      'SELECT $1, $2, $3, $4, $5, 0 WHERE (SELECT COUNT(*) FROM class_targets) < 40 ' +
      'AND (SELECT COUNT(*) FROM class_targets WHERE owner=$2) < 6',
      [p.id, p.owner, p.title, p.date, p.data]
    )).rowCount,
    deleteTarget: async (id, owner) => {
      const clause = owner === undefined ? '' : ' AND owner=$2';
      await query('DELETE FROM class_target_splats WHERE target_id=$1', [id]);
      return !!(await query(`DELETE FROM class_targets WHERE id=$1${clause}`, owner === undefined ? [id] : [id, owner])).rowCount;
    },
    throwAtTarget: async p => {
      const inserted = !!(await query(
        'INSERT INTO class_target_splats(id, target_id, item, x, y, date) ' +
        'SELECT $1, $2, $3, $4, $5, $6 WHERE (SELECT COUNT(*) FROM class_targets WHERE id=$2) > 0',
        [p.id, p.targetId, p.item, p.x, p.y, p.date]
      )).rowCount;
      if (inserted) {
        await query('UPDATE class_targets SET throws_count = throws_count + 1 WHERE id=$1', [p.targetId]);
      }
      return inserted;
    }
  };
}
