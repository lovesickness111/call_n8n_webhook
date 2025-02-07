const { log } = require("console");

// Dynamically import node-fetch
const express = require("express"),
  app = express(),
  fs = require("fs"),
  shell = require("shelljs"),
  axios = require("axios"),
  // Modify the folder path in which responses need to be stored
  folderPath = "./Responses/",
  defaultFileExtension = "json", // Change the default file extension
  bodyParser = require("body-parser"),
  DEFAULT_MODE = "writeFile",
  path = require("path");

//#region  read input data from file
// Step 1: Include the fs module
let listDebugData = [];
// Step 2: Read the JSON file
fs.readFile("debug/debug.json", "utf8", (err, data) => {
  if (err) {
    console.error("Error reading the file:", err);
    return;
  }
  // Step 3: Parse the JSON string to an object
  listDebugData = JSON.parse(data);
});

//#endregion

//#region write data to file result
// Create the folder path in case it doesn't exist
shell.mkdir("-p", folderPath);

// Change the limits according to your response size
app.use(bodyParser.json({ limit: "50mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// Write the summary data to a file
async function writeSummaryData(req, res) {
  if (!req) {
    req = { headers: {} }; // mock request
  }
  // Access and log the data
  console.log("input:" + listDebugData.length);
  const listResponse = [];
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  // Create an array of promises
  const promises = listDebugData.map((data, index) => {
    return delay(index * 500).then(() => {
      delete req.headers["host"];
      // template log data
      let logData = { input_paper: data };

      return axios
        .post(
          "https://nvcuong1.app.n8n.cloud/webhook/deeb5796-09dd-4ba4-9d4e-ec05ccf4a17b",
          {
            headers: req.headers,
            httpsAgent: new (require("https").Agent)({
              rejectUnauthorized: false,
            }), // Disable SSL certificate validation
            data: { chatInput: data },
          }
        )
        .then((response) => {
          const mergedData = mergeDataSets(response.data, data);

          listResponse.push(mergedData);
        })
        .catch((error) => {
          logData = {
            input_paper: data,
            instruction_type: "Error",
          };
          listResponse.push(logData);
        });
    });
  });

  // Await all promises
  await Promise.all(promises);
  //  console.log("output:" + listResponse.length);
  // save the response
  let extension = defaultFileExtension,
    fsMode = DEFAULT_MODE,
    uniqueIdentifier = Date.now(),
    filename = `summary_${uniqueIdentifier || ""}`,
    filePath = `${path.join("./Summary/", filename)}.${extension}`,
    options = undefined;

  fs[fsMode](filePath, JSON.stringify(listResponse), options, (err) => {
    if (err) {
      console.log(err);
    } else {
    }
  });
}
// xử lý response từ n8n
function mergeDataSets(dataSets, input_paper) {
  return dataSets.flatMap((set) =>
    set.data.map((item) => ({
      ...item,
      instruction_type: set.instruction_type,
      input_paper: input_paper,
    }))
  );
}

// nhả api ra localhost:3000/write để thực hiện lại
app.post("/write", async (req, res) => {
  await writeSummaryData(req, res);
  res.send("done");
});
// nhả api ra localhost:3000/read để đọc json
app.post("/read", async (req, res) => {
  await readSummaryData("summary_1738894233453", req, res);
});
async function readSummaryData(filename, req, res) {
  fs.readFile(`summary/${filename}.json`, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading the file:", err);
      return;
    }

    // Step 3: Parse the JSON string to an object
    const jsonObj = JSON.parse(data);
    let response = [];
    let errorArray = [];
    jsonObj.forEach((obj) => {
      if (Array.isArray(obj)) {
        obj.forEach((element) => {
          if (element.instruction_type != "Error") {
            response.push(element);
          }
        });
      } else{
        errorArray.push(obj);
      }
    });
    res.send(response);
  });
}
//#endregion

app.listen(3000, () => {
  console.log(
    "ResponsesToFile App is listening now! Send them requests to: localhost:3000/write"
  );
  console.log(
    `Data is being stored at location: ${path.join(process.cwd(), folderPath)}`
  );
});
