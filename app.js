const sqlite3 = require("sqlite3").verbose();
const axios = require("axios").default;

require("dotenv").config();

const db = new sqlite3.Database(`${process.env.DB_PATH}/Asset.db`, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log("Connected to database.");
});

const findAllAssetsQuery = `select * from assets;`;
const findAllEmployeesQuery = `select * from users;`;
// const findRentHistoriedInOneMinute = `select * from rentHistories where RegDate > datetime('${timestamp()}', '-90 seconds');`;
// const findReturnHistoriesInOneMinute = `select * from returnHistories where RegDate > datetime('${timestamp()}', '-90 seconds');`;
const findAllReturnHistories = `select * from returnHistories`;

db.serialize(() => {
  db.parallelize(() => {
    db.all(findAllAssetsQuery, [], async (err, rows) => {
      if (err) {
        throw err;
      }
      const assetList = await mappingAssetArray(rows);
      axios.post(`${process.env.URL}/asset`, assetList);
    });

    db.all(findAllEmployeesQuery, [], async (err, rows) => {
      if (err) {
        throw err;
      }
      const employeeList = await mappingEmployeeArray(rows);
      axios.post(`${process.env.URL}/employee`, employeeList);
    });

    axios
      .get(`${process.env.URL}/allRentData`)
      .then((allRentData) => {
        const latestDate = allRentData.data[0].rentDate;
        // const notReturnedAssets = allRentData.data.filter(
        //   (row) => row.returnDate === null
        // );
        // console.log(notReturnedAssets);
        console.log(latestDate);
        const findRentHistoryAfterUpdateRDS = `select * from rentHistories where RegDate > datetime('${latestDate}');`;

        db.serialize(() => {
          db.all(findRentHistoryAfterUpdateRDS, [], async (err, rows) => {
            if (err) {
              throw err;
            }
            const rentList = await mappingRentHistoriesArray(rows);
            if (rentList.length > 0) {
              axios.post(`${process.env.URL}/rentStatus`, rentList);
            }
          });

          db.all(findAllReturnHistories, [], async (err, rows) => {
            if (err) {
              throw err;
            }
            const returnHistoryList = await mappingReturnArray(rows);
            axios
              .put(`${process.env.URL}/returnAssets`, returnHistoryList)
              .then((res) => {
                console.log(res);
              })
              .catch((Err) => console.log(Err));
          });
        });
      })
      .catch((err) => {
        console.log(err);
      });

    // db.serialize(() => {
    //   db.all(findRentHistoriedInOneMinute, [], async (err, rows) => {
    //     if (err) {
    //       throw err;
    //     }
    //     const rentList = await mappingRentHistoriesArray(rows);
    //     axios.post(`${process.env.URL}/rentStatus`, rentList);
    //   });

    //   db.all(findReturnHistoriesInOneMinute, [], async (err, rows) => {
    //     if (err) {
    //       throw err;
    //     }
    //     const returnHistoryList = await mappingReturnArray(rows);
    //     axios
    //       .put(`${process.env.URL}/returnAssets`, returnHistoryList)
    //       .then((res) => {
    //         console.log(res);
    //       })
    //       .catch((Err) => console.log(Err));
    //   });
    // });
  });
});

// close the database connection
// db.close((err) => {
//   if (err) {
//     return console.error(err.message);
//   }
//   console.log("Close the database connection.");
// });

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
  const today = new Date();
  today.setHours(today.getHours() + 9);
  return today.toISOString().replace("T", " ").substring(0, 19);
}
