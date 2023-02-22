const express = require("express");
const Parser = require("rss-parser");
const parser = new Parser();

const router = express.Router();

// function doSomething() {
//   console.log("Doing something...");
// }

// setInterval(doSomething, 1 * 60 * 1000);

function convertDateTomilliseconds(date){
  const dateString = date;
  const dateObj = new Date(dateString);
  const timestamp = dateObj.getTime(); 
  return timestamp;
}


async function test() {
  const feed = await parser.parseURL("https://www.gadgets360.com/rss/news");
  const isoDate = feed.items[0].pubDate;
    console.log(feed.items.slice(0,2))

}

router.route("/kk").get(async (req, res) => {
  test();
  setInterval(test, 5 * 60 * 1000);
  res.send("ok from auto fetch");
});

module.exports = router;
