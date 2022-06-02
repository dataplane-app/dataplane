const express = require('express')
const app = express()
const port = 4000
const path = require("path");


// app.use("/", express.static("build"));
app.use("/webapp/", express.static("build"));
app.use("/webapp/*", express.static("build/index.html"));

  // app.get("/webapp/", (req, res) => {
  //   console.log(path.join(__dirname, "build/", "index.html"));
  //   res.sendFile(path.join(__dirname, "build/", "index.html"));
  //  });

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})