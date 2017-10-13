const morgan = require('morgan');
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const PORT = process.env.PORT || 8080; // default port 8080
const app = express();
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));
app.set("view engine", "ejs");


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "user1": {
    id: "ramdone223", 
    email: "user1@example.com", 
    password: "red"
  },
 "user2": {
    id: "user2", 
    email: "user2@example.com", 
    password: "blue"
  },
  "corina": {
    id: "ljfs88", 
    email: "corina@example.com", 
    password: "red"
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


const findValue = (value, valueKey, obj) => {
  for (prop in obj) {
    if (obj[prop][valueKey] === value) {
      return true;
    }
  }
};

function findUser(cookie, id, users) {
  for (user in users) {
    if (users[user][id] === cookie) {
      return user;
    }
  }
}

app.get("/urls", (req, res) => {
  let user = findUser(req.cookies['user_id'], "id", users);  
  let templateVars = {
    user: user,
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.get("/", (req, res) => {
  res.redirect("/urls");
});

// Registration page
app.get('/register', (req, res) => {
  res.render('register');
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

  // Handling registration errors
  if (userName === "") {
    res.status(400).send('Username not valid. Please go back and <a href="/register">try again</a>.');
  } else if (userEmail === "") {
    res.status(400).send('Email not valid. Please go back and <a href="/register">try again</a>.');
  } else if (findValue(userEmail, "email", users) === true) {  
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
  let user = findUser(req.cookies['user_id'], "id", users);  
  let templateVars = {
    user: user
  };
  if (!user) {
    res.redirect('/');
  } else {
    res.render("urls_new", templateVars);
  }
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
});

// individual shortURL page
app.get("/urls/:id", (req, res) => {
  let user = findUser(req.cookies['user_id'], "id", users);  
  let templateVars = {
    shortURL: req.params.id, 
    user: user,
    urls: urlDatabase 
  };
  res.render("urls_show", templateVars);
});

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

// Login page
app.get('/login', (req, res) => {
  let user = findUser(req.cookies['user_id'], "id", users);
  let templateVars = {
    cookies: req.cookies['user_id'],
    user: user
  };
  console.log(templateVars);
  res.render('login', templateVars);
});

// Login form page
app.post("/login", (req, res) => {
  let currentUser;
  let submittedEmail = req.body.email;
  // Verify email
  if (!findValue(submittedEmail, "email", users)) { 
    res.status(403).send('User with that email cannot be found. Please <a href="/login">try again</a>.')
  } else {
    // Verify password
      function findUserEmail(submittedEmail) {
        for (prop in users) {
          if (users[prop].email === submittedEmail) {
            return users[prop];
          }
        }
      }
    currentUser = findUserEmail(submittedEmail);
    if (currentUser.password === req.body.password) {
      res.cookie('user_id', currentUser.id);
      res.redirect('/');
    } else {
      res.status(403).send('Wrong password. Please try <a href="/login">again</a>.')
    }
  }
});

// Logout button in header
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});