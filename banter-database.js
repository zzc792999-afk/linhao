export const banterSchema = [
  `CREATE TABLE IF NOT EXISTS class_banter_votes (
    day TEXT NOT NULL, owner TEXT NOT NULL, scene TEXT NOT NULL, choice TEXT NOT NULL,
    PRIMARY KEY (day, owner)
  )`,
  'CREATE INDEX IF NOT EXISTS class_banter_votes_results ON class_banter_votes(day, scene, choice)'
];

export function banterStore(query) {
  return {
    writeBanterVote: (day, owner, scene, choice) => query(
      'INSERT INTO class_banter_votes(day, owner, scene, choice) VALUES($1, $2, $3, $4) ON CONFLICT(day, owner) DO NOTHING',
      [day, owner, scene, choice]
    ),
    async banterVotes(day, scene, owner) {
      const {rows} = await query(
        `SELECT choice, COUNT(*) AS count, MAX(CASE WHEN owner=$3 THEN 1 ELSE 0 END) AS mine
         FROM class_banter_votes WHERE day=$1 AND scene=$2 GROUP BY choice`,
        [day, scene, owner]
      );
      return rows;
    }
  };
}
