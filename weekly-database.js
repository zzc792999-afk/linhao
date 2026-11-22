export const weeklySchema = [
  `CREATE TABLE IF NOT EXISTS class_week_topics (
    week TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    goal INTEGER NOT NULL,
    closed INTEGER NOT NULL DEFAULT 0,
    version TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS class_week_entries (
    id TEXT PRIMARY KEY,
    week TEXT NOT NULL,
    owner TEXT NOT NULL,
    nickname TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version TEXT NOT NULL,
    UNIQUE (week, owner)
  )`,
  'CREATE INDEX IF NOT EXISTS class_week_entries_status ON class_week_entries(status,week,updated_at)'
];

const entryFields = 'id,week,nickname,body,status,updated_at';
const visibility = ['pending', 'published', 'hidden'];

export function weeklyStore(query) {
  const rows = async (sql, params = []) => (await query(sql, params)).rows;
  const changed = async (sql, params) => Number((await query(sql, params)).rowCount) > 0;
  const weeklyTopic = async week => (await rows(
    'SELECT week,question,goal,closed,version FROM class_week_topics WHERE week=$1', [week]
  ))[0];

  return {
    weeklyTopic,
    async weeklyEntries(week, owner, page = 0) {
      const [totals, entries, mine] = await Promise.all([
        rows("SELECT COUNT(*) AS count FROM class_week_entries WHERE week=$1 AND status='published'", [week]),
        rows(`SELECT ${entryFields} FROM class_week_entries
          WHERE week=$1 AND status='published'
          ORDER BY updated_at DESC,id DESC LIMIT 12 OFFSET $2`, [week, page * 12]),
        owner ? rows(`SELECT ${entryFields} FROM class_week_entries
          WHERE week=$1 AND owner=$2 AND status<>'withdrawn'`, [week, owner]) : []
      ]);
      return {total:Number(totals[0].count), entries, mine:mine[0] || null, page};
    },
    async weeklyArchive(before) {
      return rows(`SELECT e.week, MAX(t.question) AS question, COUNT(*) AS total
        FROM class_week_entries e LEFT JOIN class_week_topics t ON e.week=t.week
        WHERE e.week<$1 AND e.status='published'
        GROUP BY e.week ORDER BY e.week DESC LIMIT 8`, [before]);
    },
    async writeWeeklyEntry({id, week, owner, nickname, body, date, version}) {
      return changed(`INSERT INTO class_week_entries (id,week,owner,nickname,body,status,updated_at,version)
        SELECT $1,$2,$3,$4,$5,'pending',$6,$7
        WHERE NOT EXISTS (SELECT 1 FROM class_week_topics WHERE week=$2 AND closed=1)
        ON CONFLICT(week,owner) DO UPDATE SET
          nickname=excluded.nickname,body=excluded.body,status='pending',
          updated_at=excluded.updated_at,version=excluded.version
        WHERE class_week_entries.status='withdrawn' OR
          class_week_entries.nickname<>excluded.nickname OR class_week_entries.body<>excluded.body`,
      [id,week,owner,nickname,body,date,version]);
    },
    weeklyWithdraw(week, owner) {
      return changed(`UPDATE class_week_entries SET status='withdrawn'
        WHERE week=$1 AND owner=$2 AND status<>'withdrawn'`, [week,owner]);
    },
    async updateWeeklyTopic({week,question,goal,closed,version}, expectedVersion) {
      if (expectedVersion === '') {
        return changed(`INSERT INTO class_week_topics (week,question,goal,closed,version)
          VALUES($1,$2,$3,$4,$5) ON CONFLICT(week) DO NOTHING`, [week,question,goal,closed,version]);
      }
      return changed(`UPDATE class_week_topics SET question=$2,goal=$3,closed=$4,version=$5
        WHERE week=$1 AND version=$6`, [week,question,goal,closed,version,expectedVersion]);
    },
    async weeklyQueue(status, page) {
      if (!visibility.includes(status)) throw Error('Invalid moderation status');
      const [counts, entries] = await Promise.all([
        rows(`SELECT status,COUNT(*) AS count FROM class_week_entries
          WHERE status IN ('pending','published','hidden') GROUP BY status`),
        rows(`SELECT ${entryFields},version FROM class_week_entries WHERE status=$1
          ORDER BY updated_at DESC,id DESC LIMIT 20 OFFSET $2`, [status,page * 20])
      ]);
      const totals = Object.fromEntries(visibility.map(key => [
        key, Number(counts.find(item => item.status === key)?.count || 0)
      ]));
      return {entries, totals, page, status};
    },
    weeklyReview(id, status, expectedVersion, version, date) {
      return changed(`UPDATE class_week_entries SET status=$1,version=$2,updated_at=$3
        WHERE id=$4 AND version=$5 AND status<>'withdrawn'`, [status,version,date,id,expectedVersion]);
    },
    async clubPulse(day, from, now) {
      const [totals, nextEvent] = await Promise.all([
        rows(`SELECT
          (SELECT COUNT(*) FROM notes WHERE date >= $1) AS notes,
          (SELECT COUNT(*) FROM photos WHERE date >= $1) AS photos,
          (SELECT COUNT(*) FROM class_hen_hatches WHERE day=$2) AS chicks,
          (SELECT COUNT(*) FROM class_suggestions WHERE status='pending') AS suggestions`, [from,day]),
        rows(`SELECT title,start_at FROM class_board WHERE kind='event' AND deleted=0
          AND archived=0 AND start_at >= $1 ORDER BY start_at ASC LIMIT 1`, [now])
      ]);
      const {notes, photos, chicks, suggestions} = totals[0];
      return {notes:Number(notes),photos:Number(photos),chicks:Number(chicks),
        suggestions:Number(suggestions),nextEvent:nextEvent[0] || null};
    }
  };
}
