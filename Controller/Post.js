const Parser = require("rss-parser");
const parser = new Parser();
const request = require("request");
const cheerio = require("cheerio");
const axios = require("axios");
const { Configuration, OpenAIApi } = require("openai");
const PostDetails = require("../Model/Post");
const { json } = require("body-parser");

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
        content: ` Summarize this in 60 words :
         ${post}.`,
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
        content: `You are now ParaGPT. Your purpose is to paraphrase text. I will provide you with text, and then you will change up the words, the sentence structure, add or remove figurative language, etc and change anything necessary in order to paraphrase the text. However, it is extremely important you do not change the original meaning/significance of the text.
        text is : ${post}`,
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

async function gizchinaCreatePostHelper() {
  try {
    console.log("loop run - gizchina");
    const feed = await parser.parseURL("https://www.gizchina.com/feed/");
    const allPost = await PostDetails.findOne({originalPostBy:"gizchina"}).sort({ publishDate: "desc" });

    // filter top 10 posts from feed
    const topTenPosts = feed.items.slice(0, 10);

    for (let index = 0; index < topTenPosts.length; index++) {
      const post = topTenPosts[index];
      const postUrl = post.link;
      const pubDate = convertDateTomilliseconds(post.pubDate);

      if (allPost?.publishDate >= pubDate) {
        console.log("alredy fetched");
        // res.send("alredy fetched")
        break;
      } else {
        await axios.get(postUrl).then(async (response) => {
          const $ = cheerio.load(response.data);
          const title = $("h1").text();
          let content = $(".vw-post-content").text().trim();
          const readAlso = $(
            'div[style="clear:both; margin-top:0em; margin-bottom:1em;"]'
          ).text();
          const newsSource = $(".news-source").text();
          content = content.replace(readAlso, "");
          content = content.replace("Source/VIA :", "");
          content = content.replace(newsSource, "");
          content = content.replace("Join GizChina on Telegram", "");
          content = content.replace(
            /window\._taboola = window\._taboola \|\| \[\];[\s\S]*?Lu Weibing/g,
            ""
          );

          content = content
            .replace(
              /window\._taboola = window\._taboola \|\| \[\];\s*_taboola\.push\(\{\s*mode:\s*'alternating-thumbnails-a',\s*container:\s*'taboola-below-article-thumbnails',\s*placement:\s*'Below Article Thumbnails',\s*target_type:\s*'mix'\s*\}\);\s*/,
              ""
            )
            .replace("Gizchina News of the week", "");

          const imageTag = $("img.attachment-presso_thumbnail_large");
          const image_url = imageTag.attr("src");

          const repost = await reWritePost(content);
          const summerize = await summarizePost(content);

          await PostDetails.create({
            title: title,
            image: image_url,
            publishDate: pubDate,
            description: summerize,
            fullDescription: repost.trimStart(),
            originalPost: postUrl,
            originalPostBy: "gizchina",
          });
          console.log("new post created - gizchina \n", title);
        });
      }

      await sleep(30000);
    }

    console.log("...end....");
  } catch (error) {
    console.error(error.message);
  }
}

async function gadgets360CreatePostHelper() {
  try {
    console.log("loop run - gadgets 360");
    const feed = await parser.parseURL("https://www.gadgets360.com/rss/news");
    const allPost = await PostDetails.findOne({originalPostBy:"gadgets360"}).sort({ publishDate: "desc" });

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

            const repost = await reWritePost(content);

            // create full post
            await PostDetails.create({
              title: headline,
              image: image_url,
              publishDate: pubDate,
              description: postdetails,
              fullDescription: repost.trimStart(),
              originalPost: postUrl,
              originalPostBy: "gadgets360",
            });

            console.log("new post created - gadgets360 \n", headline);
          }
        });
      }

      await sleep(30000);
    }

    console.log("...end....");
  } catch (error) {
    console.error(error.message);
  }
}

exports.createPost = async (req, res) => {
  try {
    gadgets360CreatePostHelper().then(gizchinaCreatePostHelper);

    setInterval(
      () => gadgets360CreatePostHelper().then(gizchinaCreatePostHelper),
      10 * 60 * 1000
    );

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
  try {
    gizchinaCreatePostHelper();
    res.send("okkkkkkkkkkkkkk");
  } catch (error) {
    console.log(error.message);
    res.send("error");
  }
};


