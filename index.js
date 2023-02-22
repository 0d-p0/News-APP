const express = require("express");

require("dotenv").config();

const app = express();

const bodyParser = require("body-parser");

const postRoute = require("./Routes/PostRoute");

const blog = require("./Routes/blog");

const autoFetcher = require("./Routes/autofetch");

const { connectDatabase } = require("./config/ConnectMongo");

connectDatabase();

// parse application/json
app.use(bodyParser.json());
app.use(bodyParser.text({ type: "text/plain" }));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));



app.use("/", blog);
app.use("/", autoFetcher);
app.use("/", postRoute);

app.get("/", async (req, res) => {
  res.send("hello dev");
});


app.listen("4000", () => {
  console.log("server run on 4000");
});
