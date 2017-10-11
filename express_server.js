const morgan = require('morgan')
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')
const PORT = process.env.PORT || 8080; // default port 8080
const app = express();
app.use(cookieParser())
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));
app.set("view engine", "ejs");


let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

app.get("/urls", (req, res) => {
  res.render("urls_index", {urls: urlDatabase});
});

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

//create a short URL
app.post("/urls/new", (req, res) => {
  let longURL = req.body.longURL;
  if (!longURL.includes('www')) {
    longURL = 'http://www.' + longURL;
  } else if (!longURL.includes('http')) {
    longURL = 'http://' + longURL;
  }
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  console.log(urlDatabase);
  res.redirect('/urls/'+ shortURL);   
});

// delete a URL
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
})

// individual shortURL page
app.get("/urls/:id", (req, res) => {
  let templateVars = {shortURL: req.params.id, urls: urlDatabase };
  res.render("urls_show", templateVars)
})

// update an individual URL
app.post('/urls/:id', (req, res) => {
  let newURL = req.body.longURL;
  let shortURL = req.params.id;
  if (!newURL.includes('www')) {
    newURL = 'http://www.' + newURL;
  } else if (!lmzODw.includes('http')) {
    newURL = 'http://' + newURL;
  }
  urlDatabase[shortURL] = newURL;
  res.redirect('/urls');
});

// redirect to full URL from shortURL
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(302, longURL);
});

// Login form submission
app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect('/urls');
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});