'use strict';

const googleAPI = process.env.GOOGLE_KEY;
const googleCX = process.env.GOOGLE_CX;

require('dotenv').load();
const express = require('express');
const https = require('https');
const fs = require('fs')
const app = express();

app.use(express.static(__dirname + '/'));

app.get('/search/:squery', (req, res) => {
  let searchUrl =
    `https://www.googleapis.com/customsearch/v1?key=${googleAPI}&cx=${googleCX}&q=${req.params.squery}&searchType=image&fields=items(link,snippet,image/contextLink)`;
    let offset = parseInt(req.query.offset);
    if (offset) {
      searchUrl += '&start=' + (offset * 10 + 1)
    }
    https.get(searchUrl, (
        response) => {
        console.log(`Got response: ${response.statusCode}`);
        let responseStr = '';
        response.on("data", data => {
          responseStr += data;
        });
        response.on("end", () => {
          let itemsArray = JSON.parse(responseStr).items;
          itemsArray = itemsArray.map(val => {
            return {url: val.link, alttext: val.snippet, pageurl: val.image.contextLink};
          });
          res.send(itemsArray);
        });
      }).on('error', (e) => {
      console.log(`Got error: ${e.message}`);
    });
    
    // Store 10 most recent saves in local file instead of a DB.
    let now = new Date();
    let topTen = JSON.parse(fs.readFileSync(__dirname + '/recentTen.json'));
    if (topTen.length > 10) { topTen.pop(); }
    topTen.unshift({terms: req.params.query, time: now.toDateString() + ' ' + now.toTimeString()});
    fs.writeFile(__dirname + '/recentTen.json', JSON.stringify(topTen), (err) => {
      if (err) console.log('Error:' + err);
    });
});

app.get('/recent',(req,res) =>{
  fs.createReadStream(__dirname + '/recentTen.json').pipe(res);
});

app.listen(process.env.PORT);