const express = require("express")

const request = require('request');
const cheerio = require('cheerio');

const router = express.Router()

router.route('/pp').get((req, res) => {
  
const url = 'https://www.gadgets360.com/others/news/xiaomi-13-pro-lite-price-leak-eur-499-999-1299-colour-options-design-mwc-2023-launch-3794221';

request(url, function (error, response, html) {
  if (!error && response.statusCode == 200) {
    const $ = cheerio.load(html);

    const headline = $('h1').text();
    let content = $('.content_text').text();

    const dontInclude = $('.alsoseewgt');

    dontInclude.each(function(i, elem) {
      content = content.replace($(this).text(), '');
     
    });

    console.log('Content: ', content);
  }
});

res.send("llo[p")

  });


module.exports = router
