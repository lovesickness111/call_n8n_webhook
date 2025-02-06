// Step 1: Include the fs module
const fs = require('fs');

// Step 2: Read the JSON file
fs.readFile('debug/debug.json', 'utf8', (err, data) => {
  if (err) {
    console.error("Error reading the file:", err);
    return;
  }
  
  // Step 3: Parse the JSON string to an object
  const jsonObj = JSON.parse(data);
  
  // Step 4: Access and log the data
  console.log(jsonObj.A.length); // Replace jsonObj with your specific way to access data if needed
});
