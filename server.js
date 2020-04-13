'use strict';

// Application Setup:

require('dotenv').config();
const express = require('express');
const pg = require('pg');
const superagent = require('superagent');
const PORT = process.env.PORT || 4000;
const app = express();
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', (err) => console.log(err));

//middlewares

app.use(express.urlencoded({ extended: true })); //Tell the server I want to post a FORM
app.use('/public', express.static('public')); // tell the server to connect the CSS

// set the view engine

app.set('view engine', 'ejs'); 

//Main Route

app.get('/', (req, res) => {  // render the index.ejs from DB
  const SQL = 'SELECT * FROM books;';
  client
    .query(SQL)
    .then((results) => {
      res.render('pages/index.ejs', { book: results.rows });
    })
    .catch((err) => {
      errorHandler(err, req, res);
    });
});

app.get('/books/:id', (req, res) => {  // render the 
  const SQL = 'SELECT * FROM books WHERE id=$1;';
  const values = [req.params.id];
  client
    .query(SQL, values)
    .then((results) => {
      res.render('pages/books/detail.ejs', { book : results.rows[0] });
    })
    .catch((err) => {
      errorHandler(err, req, res);
    });
});

app.post('/books',(req, res)=>{
  const sqlSearch = 'SELECT title FROM books WHERE title=$1;'
  const searchVal = [req.body.title];
  client.query(sqlSearch, searchVal).then((searchedResult)=> {
    if(searchedResult.rows.length > 0){
        res.redirect('/');
    }else{
  const SQL ='INSERT INTO books (image_url,title,author,description) VALUES ($1,$2,$3,$4)';
  const values =[req.body.img, req.body.title ,req.body.author ,req.body.description];
  client.query(SQL, values).then((results) => {
      // res.render('pages/books/detail.ejs', { book : results.rows[0] });
      res.redirect('/');
    })
    .catch((err) => {
      errorHandler(err, req, res);
    })
}})
});

//Form Route

app.get('/searches/new', (req, res) => {  // render the new.ejs from the views folder and pass object to it
    res.render('pages/searches/new.ejs');
});

//Showing Books Route

app.post('/searches', (req, res) => { // render the show.ejs from the views folder
  const searchKeyword = req.body.searched;
  const filterApplied = req.body.radio;
    let url =`https://www.googleapis.com/books/v1/volumes?q=${searchKeyword}&in${filterApplied}=${searchKeyword}`;
    superagent.get(url).then((apiResponse) => {
        // console.log(req.body.searched);
        // console.log(req.body.radio);
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


app.use('*', notFoundHandler);
app.use(errorHandler);

  // Error Handlers:

function notFoundHandler(req, res) {
  res.status(404).send('NOT FOUND!!');
}
function errorHandler(err, req, res) {
  res.status(500).send(err);
}

client.connect().then(() => {
  app.listen(PORT, () => console.log(`my server is up and running on port ${PORT}`));
});