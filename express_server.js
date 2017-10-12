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


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "user1": {
    id: "user1", 
    email: "user1@example.com", 
    password: "red"
  },
 "user2": {
    id: "user2", 
    email: "user2@example.com", 
    password: "blue"
  }
};

function generateRandomString() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function findUser(user_id) {
  for (user in users) {
    if (users[user].id == user_id) {
      return users[user];
    }
  }
}

app.get("/urls", (req, res) => {
  let templateVars = {
    user: findUser(req.cookies['user_id']),
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Registration page
app.get('/register', (req, res) => {
  res.render('register')
});

app.post('/register', (req, res) => {
  let userID = generateRandomString();
  let userName = req.body.username;
  let userEmail = req.body.email;
  let userPass = req.body.password;
  let user = {};
  user.id = userID;
  user.email = userEmail;
  user.password = userPass;

  const emailRegistered = function(userEmail, users) {
    for (prop in users) {
      if (users[prop].email === userEmail) {
        return true;
      } else {
        return false;
      }
    }
  }
  // Handling registration errors
  if (userName === "") {
    res.status(400).send('Username not valid. Please go back and <a href="/register">try again</a>.');
  } else if (userEmail === "") {
    res.status(400).send('Email not valid. Please go back and <a href="/register">try again</a>.');
  } else if ((emailRegistered(userEmail, users) === true)) {  
    res.status(400).send('Email is already registered. Please go back and <a href="/register">try again</a>.')
  } else if (userPass === "") {
    res.status(400).send('You did not enter a password. Please go back and <a href="/register">try again</a>.');
  } else { 
    users[userName] = user;
    console.log(users);
    res.cookie("user_id", userID);
    res.redirect('urls');
  }
});


app.get("/urls/new", (req, res) => {
  let templateVars = {user: findUser(req.cookies['user_id'])};
  res.render("urls_new", templateVars);
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
  res.redirect('/urls/'+ shortURL);   
});

// delete a URL
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
})

// individual shortURL page
app.get("/urls/:id", (req, res) => {
  let templateVars = {
    user: findUser(req.cookies['user_id']),
    shortURL: req.params.id, 
    urls: urlDatabase 
  };
  res.render("urls_show", templateVars)
})

// update an individual URL
app.post('/urls/:id', (req, res) => {
  let newURL = req.body.longURL;
  let shortURL = req.params.id;
  if (!newURL.includes('www')) {
    newURL = 'http://www.' + newURL;
  } else if (!newURL.includes('http')) {
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
  let templateVars = {user: findUser(req.cookies['user_id'])};
  res.redirect('/urls', templateVars);
});

// Login page
app.get('/login', (req, res) => {
  let templateVars = {user: findUser(req.cookies['user_id'])};
  console.log(templateVars);
  res.render('login');
})

// Logout button
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});