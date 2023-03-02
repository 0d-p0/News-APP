const Parser = require("rss-parser");
const parser = new Parser();
const request = require("request");
const cheerio = require("cheerio");
const { Configuration, OpenAIApi } = require("openai");
const PostDetails = require("../Model/Post");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function convertDateTomilliseconds(date) {
  const dateString = date;
  const dateObj = new Date(dateString);
  const timestamp = dateObj.getTime();
  return timestamp;
}

const configuration = new Configuration({
  apiKey: process.env.my_api_key,
});
const openai = new OpenAIApi(configuration);

async function summarizePost(post) {
  // const prompt = `summarize the text : ${post} under 100 words`;
  // try {
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "user",
        content: ` ${post}.\n\nTl;dr`,
      },
    ],
  });

  return response.data.choices[0].message.content;
  // } catch (error) {
  //   console.error(error.message);
  // }
}

async function reWritePost(post) {
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "user",
        content: `rewrite the text : ${post}`,
      },
    ],
  });

  return response.data.choices[0].message.content;
}

exports.getAllPosts = async (req, res) => {
  try {
    const allPosts = await PostDetails.find().sort({ publishDate: "desc" });

    res.json([
      {
        allPosts,
        success: true,
      },
    ]);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

async function createPostHelper() {
  try {
    console.log("loop run");
    const feed = await parser.parseURL("https://www.gadgets360.com/rss/news");
    const allPost = await PostDetails.findOne().sort({ publishDate: "desc" });

    // filter top 10 posts from feed
    const topTenPosts = feed.items.slice(0, 10);

    for (let index = 0; index < topTenPosts.length; index++) {
      const post = topTenPosts[index];
      const postUrl = post.guid;
      const pubDate = convertDateTomilliseconds(post.pubDate);

      if (allPost?.publishDate >= pubDate) {
        console.log("alredy fetched");
        // res.send("alredy fetched")
        break;
      } else {
        request(postUrl, async function (error, response, html) {
          if (!error && response.statusCode == 200) {
            const $ = cheerio.load(html);

            const headline = $("h1").text();
            const image_tag = $("div.heroimg img");
            const image_url = image_tag.attr("src");

            let content = $(".content_text").text();

            const dontInclude = $(".alsoseewgt");
            const emphasis = $("em");

            dontInclude.each(function (i, elem) {
              content = content.replace($(this).text(), "");
            });
            emphasis.each(function (i, elem) {
              content = content.replace($(this).text(), "");
            });
            // here post is summerize
            const postdetails = await summarizePost(content);
            //.then((postdetails) => {

            const repost = await reWritePost(content);

            // create full post
            await PostDetails.create({
              title: headline,
              image: image_url,
              publishDate: pubDate,
              description: postdetails,
              fullDescription: repost,
            });
            //});

            console.log("new post created ", headline);
           
          }
        });
      }

    await  sleep(30000);
    }

    console.log("...end....");
  } catch (error) {
    console.error(error.message);
  }
}

exports.createPost = async (req, res) => {
  try {
    createPostHelper();
    setInterval(() => createPostHelper(), 10 * 60 * 1000);

    res.json({
      message: "creating post process start",
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

function checkPostAge(timestamp) {
  const birthdate = new Date(timestamp);
  const now = new Date();
  const ageInDays = Math.floor((now - birthdate) / (1000 * 60 * 60 * 24));

  return ageInDays;
}

async function deletePostHelper() {
  try {
    const allposts = await PostDetails.find();

    if (allposts.length == 0) {
      console.log("no post available");
      return;
    }

    allposts.forEach(async (item) => {
      if (checkPostAge(item.publishDate) >= 2) {
        await PostDetails.deleteOne(item);
        console.log("item delete", item.title);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
}

exports.deletePosts = async (req, res) => {
  try {
    deletePostHelper();
    setInterval(() => deletePostHelper(), 48 * 60 * 60 * 1000);
    res.status(200).json({
      message: "deleting process start",
    });
  } catch (error) {
    res.json(500).json({
      message: error.message,
    });
  }
};

exports.tests = async (req, res) => {
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "user",
        content: `rewrite the text : ${post}`,
      },
    ],
  });

  res.send(response.data.choices[0].message.content);
};
