const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const axios = require("axios").default;
const FormData = require("form-data");
require("dotenv").config();

const form = new FormData();
form.append("username", "admin");
form.append("password", "diveroid123!");

// console.log(process.env.PORT);
// open database in memory
const db = new sqlite3.Database(
  "/Users/leejungyu/Downloads/Asset.db",
  (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log("Connected to database.");
  }
);

// 전체 테이블 명 조회
const sql = `SELECT name FROM sqlite_master WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite_%' UNION ALL SELECT name FROM sqlite_temp_master WHERE type IN ('table', 'view') ORDER BY 1;`;

const findAllAssetsQuery = `select * from assets;`;
const findAllEmployeesQuery = `select * from users;`;
const findRentHistoriedInOneMinute = `select * from rentHistories where RegDate > datetime('${timestamp()}', '-90 seconds');`;
const findReturnHistoriesInOneMinute = `select * from returnHistories;`;

db.serialize(() => {
  db.parallelize(() => {
    db.all(findAllAssetsQuery, [], async (err, rows) => {
      if (err) {
        throw err;
      }
      // console.log(rows);
      const AssetList = await mappingAssetArray(rows);
      axios
        .post("http://localhost:8080/nfc/asset", AssetList)
        .then((result) => {
          // console.log(result);
        })
        .catch((err) => {
          // console.error(err);
        });
    });

    db.all(findAllEmployeesQuery, [], async (err, rows) => {
      if (err) {
        throw err;
      }
      // console.log(rows);
      const employeeList = await mappingEmployeeArray(rows);
      axios
        .post("http://localhost:8080/nfc/employee", employeeList)
        .then((result) => {
          // console.log(result);
        })
        .catch((err) => {
          // console.error(err);
        });
    });
    db.serialize(() => {
      db.all(findRentHistoriedInOneMinute, [], async (err, rows) => {
        if (err) {
          throw err;
        }
        // console.log(rows);
        const rentList = await mappingRentHistoriesArray(rows);
        axios.post("http://localhost:8080/nfc/rentStatus", rentList);
      });

      db.all(findReturnHistoriesInOneMinute, [], async (err, rows) => {
        const returnHistoryList = await mappingReturnArray(rows);
        // axios.post("http://localhost:8080/nfc/returnAssets", returnHistoryList);
        axios.put("http://localhost:8080/nfc/returnAssets", [
          {
            assetId: 1,
            returnDate: "1234",
          },
        ]);
      });
    });
  });
});

// close the database connection
db.close((err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Close the database connection.");
});

async function mappingAssetArray(rows) {
  let newArr = [];
  rows.map((row) => {
    let obj = {};
    obj["assetId"] = row.Id;
    obj["name"] = row.Name;
    obj["tagUid"] = row.TagUID;
    obj["editDate"] = row.EditDate;
    newArr.push(obj);
  });

  return newArr;
}

async function mappingEmployeeArray(rows) {
  let newArr = [];
  rows.map((row) => {
    let obj = {};
    obj["employeeId"] = row.Id;
    obj["cardNumber"] = row.VisibleCardNumber;
    obj["cardUid"] = row.CardUID;
    obj["name"] = row.Name;
    obj["departmentName"] = row.DeptmentName;
    newArr.push(obj);
  });

  return newArr;
}

async function mappingRentHistoriesArray(rows) {
  let newArr = [];
  rows.map((row) => {
    let obj = {};
    obj["rentStatusId"] = row.Id;
    obj["assetId"] = row.AssetsId;
    obj["employeeId"] = row.UsersId;
    obj["rentDate"] = row.RegDate;
    newArr.push(obj);
  });

  return newArr;
}

async function mappingReturnArray(rows) {
  let newArr = [];
  rows.map((row) => {
    let obj = {};
    obj["assetId"] = row.AssetsId;
    obj["rentDate"] = row.RegDate;
    newArr.push(obj);
  });

  return newArr;
}

function timestamp() {
  var today = new Date();
  today.setHours(today.getHours() + 9);
  return today.toISOString().replace("T", " ").substring(0, 19);
}
