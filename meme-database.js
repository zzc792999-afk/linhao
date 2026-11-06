export const memeSchema = [
  'CREATE TABLE IF NOT EXISTS class_memes(id TEXT PRIMARY KEY, owner TEXT NOT NULL, nickname TEXT NOT NULL, title TEXT NOT NULL, date TEXT NOT NULL, data BYTEA NOT NULL, likes_count INTEGER NOT NULL DEFAULT 0)',
  'CREATE TABLE IF NOT EXISTS class_meme_likes(meme_id TEXT NOT NULL, owner TEXT NOT NULL, PRIMARY KEY(meme_id, owner))',
  'CREATE INDEX IF NOT EXISTS class_memes_date ON class_memes(date DESC)'
];

export function memeStore(query) {
  const rows = async (sql, args = []) => (await query(sql, args)).rows;

  return {
    async memes(owner) {
      const list = await rows(
        `SELECT m.id, m.nickname, m.title, m.date, m.likes_count,
                CASE WHEN m.owner = $1 THEN 1 ELSE 0 END AS mine,
                CASE WHEN l.owner IS NOT NULL THEN 1 ELSE 0 END AS liked
         FROM class_memes m
         LEFT JOIN class_meme_likes l ON l.meme_id = m.id AND l.owner = $1
         ORDER BY m.date DESC, m.id DESC
         LIMIT 60`,
        [owner]
      );
      return list.map(m => ({
        id: m.id,
        nickname: m.nickname,
        title: m.title,
        date: m.date,
        likes: Number(m.likes_count) || 0,
        mine: Boolean(m.mine),
        liked: Boolean(m.liked)
      }));
    },

    async meme(id) {
      const result = await rows('SELECT id, owner, nickname, title, date, likes_count, data FROM class_memes WHERE id = $1', [id]);
      return result[0] || null;
    },

    async memeImage(id) {
      const result = await rows('SELECT data FROM class_memes WHERE id = $1', [id]);
      return result[0]?.data || null;
    },

    async addMeme({ id, owner, nickname, title, date, data }) {
      const countResult = await rows('SELECT COUNT(*) AS total FROM class_memes');
      const total = Number(countResult[0]?.total) || 0;
      if (total >= 200) {
        // Remove the oldest meme if at capacity
        await query('DELETE FROM class_memes WHERE id IN (SELECT id FROM class_memes ORDER BY date ASC LIMIT 1)');
      }

      await query(
        'INSERT INTO class_memes(id, owner, nickname, title, date, data, likes_count) VALUES($1, $2, $3, $4, $5, $6, 0)',
        [id, owner, nickname, title, date, data]
      );
      return true;
    },

    async likeMeme(memeId, owner, liked) {
      const target = await rows('SELECT id, likes_count FROM class_memes WHERE id = $1', [memeId]);
      if (!target.length) return null;

      if (liked) {
        const insertRes = await query(
          'INSERT INTO class_meme_likes(meme_id, owner) VALUES($1, $2) ON CONFLICT DO NOTHING',
          [memeId, owner]
        );
        if (insertRes.rowCount > 0) {
          await query('UPDATE class_memes SET likes_count = likes_count + 1 WHERE id = $1', [memeId]);
        }
      } else {
        const deleteRes = await query(
          'DELETE FROM class_meme_likes WHERE meme_id = $1 AND owner = $2',
          [memeId, owner]
        );
        if (deleteRes.rowCount > 0) {
          await query('UPDATE class_memes SET likes_count = MAX(0, likes_count - 1) WHERE id = $1', [memeId]);
        }
      }

      const updated = await rows('SELECT likes_count FROM class_memes WHERE id = $1', [memeId]);
      const isLiked = (await rows('SELECT 1 FROM class_meme_likes WHERE meme_id = $1 AND owner = $2', [memeId, owner])).length > 0;
      return {
        likes: Number(updated[0]?.likes_count) || 0,
        liked: isLiked
      };
    },

    async deleteMeme(id, owner) {
      await query('DELETE FROM class_meme_likes WHERE meme_id = $1', [id]);
      const res = await query('DELETE FROM class_memes WHERE id = $1 AND owner = $2', [id, owner]);
      return res.rowCount > 0;
    },

    async adminDeleteMeme(id) {
      await query('DELETE FROM class_meme_likes WHERE meme_id = $1', [id]);
      const res = await query('DELETE FROM class_memes WHERE id = $1', [id]);
      return res.rowCount > 0;
    },

    async topMemes(limit = 6) {
      const list = await rows(
        `SELECT id, nickname, title, date, likes_count
         FROM class_memes
         ORDER BY likes_count DESC, date DESC
         LIMIT $1`,
        [limit]
      );
      return list.map(m => ({
        id: m.id,
        nickname: m.nickname,
        title: m.title,
        date: m.date,
        likes: Number(m.likes_count) || 0
      }));
    }
  };
}
