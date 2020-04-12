'use strict';

// Application Setup:

require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const PORT = process.env.PORT || 4000;
const app = express();
app.use(express.urlencoded({ extended: true })); //Tell the server I want to post a FORM
app.set('view engine', 'ejs'); // set the view engine
// app.use('*', notFoundHandler);
// app.use(errorHandler);

//Main Route

app.get('/', (req, res) => {  // render the index.ejs from the views folder
  res.render('pages/index.ejs');
});

//Form Route

app.get('/searches/new', (req, res) => {  // render the new.ejs from the views folder and pass object to it
    res.render('pages/searches/new.ejs');
});

//Showing Books Route

app.post('/searches', (req, res) => { // render the show.ejs from the views folder
    const url = `https://www.googleapis.com/books/v1/volumes?q=${req.body.searched}`;
    superagent.get(url).then((apiResponse) => {
        // console.log(apiResponse);
        const book = apiResponse.body.items.map((data) => {
            return new Book(data);
          });
          res.render('pages/searches/show.ejs', { book: book });
    })
    .catch((err) => errorHandler(err, req, res));
  });

function Book(data) {
    this.image_url = data.volumeInfo.imageLinks.thumbnail  ? data.volumeInfo.imageLinks.thumbnail : "DEFULT IMG";
    this.title = data.volumeInfo.title ?  data.volumeInfo.title : "DEFULT TITLE";
    this.author = data.volumeInfo.authors ? data.volumeInfo.authors : "DEFULT AUTHOR";
    this.description = data.volumeInfo.description ? data.volumeInfo.description : "DEFULT DESCRIPTION";
  }

  // Error Handlers:

// function notFoundHandler(req, res) {
//   res.status(404).send('NOT FOUND!!');
// }
function errorHandler(err, req, res) {
  res.status(500).send(err);
}

app.listen(PORT, () =>
      console.log(`my server is up and running on port ${PORT}`)
    );
    