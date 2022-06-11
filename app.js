const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");

// open database in memory
let db = new sqlite3.Database("C:/Users/jk/Downloads/Asset.db", (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log("Connected to the chinook database.");
});

// 전체 테이블 명 조회
let sql = `SELECT name FROM sqlite_master WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite_%' UNION ALL SELECT name FROM sqlite_temp_master WHERE type IN ('table', 'view') ORDER BY 1;`;

let sql1 = `select * from assets;`;
let sql2 = `select * from rentHistories;`;
let sql3 = `select * from returnHistories;`;
let sql4 = `select * from users;`;

db.serialize(() => {
  //직렬
  db.all(sql1, [], (err, rows) => {
    // 모든결과
    if (err) {
      throw err;
    }
    // rows.forEach((row) => {
    console.log(rows);
    fs.writeFileSync(`C:/Users/jk/Downloads/testAPP/${Date.now()}zz.txt`, "ss");
    // });
  });
});

// close the database connection
db.close((err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Close the database connection.");
});
