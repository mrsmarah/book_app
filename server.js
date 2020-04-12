'use strict';
require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const PORT = process.env.PORT || 4000;

const app = express();
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');// set the view engine

app.get('/hello', (req, res) => {  // render the index.ejs from the views folder
  res.render('pages/index.ejs');
});

app.get('/searches/new', (req, res) => {  // render the new.ejs from the views folder and pass object to it
    res.render('pages/searches/new.ejs');
});

app.post('/searches', (req, res) => { // render the show.ejs from the views folder
    const url = `https://www.googleapis.com/books/v1/volumes?q=${req.body.searched}`;
    superagent.get(url).then((apiResponse) => {
        // console.log(apiResponse);
        const book = apiResponse.body.items.map((data) => {
            return new Book(data);
          });
          res.render('pages/searches/show.ejs', { book: book });
    });
  });

function Book(data) {
    this.image_url = data.volumeInfo.imageLinks.thumbnail;
    this.title = data.volumeInfo.title;
    this.author = data.volumeInfo.authors;
    this.description = data.volumeInfo.description;
  }


app.listen(PORT, () =>
      console.log(`my server is up and running on port ${PORT}`)
    );