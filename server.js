'use strict';

// Application Setup:

require('dotenv').config();
const express = require('express');
const pg = require('pg');
const methodOverride = require('method-override');
const superagent = require('superagent');
const PORT = process.env.PORT || 4000;
const app = express();
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', (err) => console.log(err));

//middlewares

app.use(express.urlencoded({ extended: true })); //Tell the server I want to post a FORM
app.use('/public', express.static('public')); // tell the server to connect the CSS
app.use(methodOverride('_method')); //tell the server to override post method to listen to UPDATE/DELETE queries

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


app.get('/edit/:id', (req, res) => {  // render the edit.ejs (form)
  const SQL = 'SELECT * FROM books WHERE id=$1;';
  const values = [req.params.id];
  client
    .query(SQL, values)
    .then((results) => {
      res.render('pages/books/edit.ejs', { book : results.rows[0] });
    })
    .catch((err) => {
      errorHandler(err, req, res);
    });
});

app.get('/books/:id', (req, res) => {  // render the datails of a book
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


app.post('/books',(req, res)=>{// Insert books into DB if not
  let SQL = 'SELECT isbn FROM books WHERE isbn=$1;'
  let values = [req.body.isbn];
  client.query(SQL, values).then((results)=> {
    if(results.rows.length > 0){
      res.redirect('/');
      // res.render('pages/books/show.ejs', { book : results.rows[0] });
    }else{
  let SQL ='INSERT INTO books (image_url,title,author,description,isbn) VALUES ($1,$2,$3,$4,$5);';
  let values =[req.body.img, req.body.title ,req.body.author ,req.body.description, req.body.isbn];
  client.query(SQL, values).then((results) => {
      res.redirect('/');
      // res.render('pages/books/show.ejs', { book : values });
    })
    .catch((err) => {
      errorHandler(err, req, res);
    })
}})
});

//Form Route

app.get('/searches/new', (req, res) => {  // render the new.ejs (search form) 
   res.render('pages/searches/new.ejs');
});


//Updating 

app.put('/update/:id', (req, res) => { 
  const SQL ='UPDATE books SET image_url=$1,title=$2,author=$3,description=$4,isbn=$5 WHERE id=$6;';
  const values =[req.body.img, req.body.title ,req.body.author ,req.body.description, req.body.isbn, req.params.id];
client
.query(SQL,values).then((results)=> res.redirect(`/books/${req.params.id}`))
.catch((err)=> errorHandler(err,req,res))
});

//Deleting

app.delete('/delete/:id', (req, res) => { 
  const SQL = 'DELETE FROM books WHERE id=$1';
  const values = [req.params.id];
  client
    .query(SQL, values)
    .then((results) => res.redirect('/'))
    .catch((err) => errorHandler(err, req, res))
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
    this.isbn = data.volumeInfo.industryIdentifiers[0].identifier;
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