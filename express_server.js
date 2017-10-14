const morgan = require('morgan');
const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session')
const bcrypt = require('bcrypt');
const PORT = process.env.PORT || 8080; // default port 8080
const app = express();
app.use(cookieSession({
  name: 'session',
  keys: ["secret123"],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));
app.set("view engine", "ejs");


const urlDatabase = {
  "b2xVn2": {
    url: "http://www.lighthouselabs.ca",
    userID: "ramdone223"
  },
  "9sm5xK": {
    url: "http://www.google.com",
    userID: "ljfs88"
  }
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
  return false;
}

const findEmail = (cookie, id, email, users) => {
  for (user in users) {
    if (users[user][id] === cookie) {
      return (users[user][email]);
    }
  }
}

app.get("/", (req, res) => {
  if (!req.session.user_id) {
    res.redirect('/login');
  } else {
  res.redirect("/urls");
  }
});


app.get("/urls", (req, res) => {
  let userCookie = req.session.user_id
  let email = findEmail(userCookie, "id", "email", users);
  let urls;
  let urlsForUser = function(cookie) {
    let list = [];
    for (url in urlDatabase) {
      if (cookie === urlDatabase[url].userID) {
        let includeURL = {};
        includeURL.short = url;
        includeURL.long = urlDatabase[url].url;
        list.push(includeURL);
      }
    }
    return list;
  }
  if (userCookie) {
    urls = urlsForUser(userCookie);
    let templateVars = {
      urls: urls,
      email: email
    };
    res.render("urls_index", templateVars);
  } else {
    res.send('Please <a href="/register">Register</a> or <a href="/login">Login</a>' )
  }
});

// Registration page
app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', (req, res) => {
  let userID = generateRandomString();
  // let userName = req.body.username;
  let userEmail = req.body.email;
  let userPass = bcrypt.hashSync(req.body.password, 10);
  let user = {};
  user.id = userID;
  user.email = userEmail;
  user.password = userPass;

  // Handling registration errors
  if (userEmail === "") {
    res.status(400).send('Email not valid. Please go back and <a href="/register">try again</a>.');
  } else if (findValue(userEmail, "email", users) === true) {  
    res.status(400).send('Email is already registered. Please go back and <a href="/register">try again</a>.')
  } else if (userPass === "") {
    res.status(400).send('You did not enter a password. Please go back and <a href="/register">try again</a>.');
  } else { 
    users[userID] = user;
    console.log(users)
    req.session.user_id = userID;
    res.redirect('urls');
  }
});


app.get("/urls/new", (req, res) => {
  let userCookie = req.session.user_id;
  let email = findEmail(userCookie, "id", "email", users);
  console.log(email);
  let templateVars = {
    email: email
  }
  if (!req.session.user_id) {
    res.redirect('/login');
  } else {
    res.render("urls_new", templateVars);
  }
});

//create a short URL
app.post("/urls", (req, res) => {
  let userCookie = req.session.user_id;
  if (!userCookie) {
    res.redirect('/login');
  } else {
    let longURL = req.body.longURL;
    if (!longURL.includes('www')) {
      longURL = 'http://www.' + longURL;
    } else if (!longURL.includes('http')) {
      longURL = 'http://' + longURL;
    } 
    let shortURL = generateRandomString();
    urlDatabase[shortURL] = {};
    urlDatabase[shortURL].url = longURL;
    urlDatabase[shortURL].userID = req.session.user_id;
    res.redirect('/urls/'+ shortURL);   
  }  
});

// delete a URL
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// individual shortURL page
app.get("/urls/:id", (req, res) => {
  let userCookie = req.session.user_id;
  let email = findEmail(userCookie, "id", "email", users);
  let shortURL = req.params.id;  
  let longURL = urlDatabase[shortURL].url;
  let templateVars = {
    shortURL: shortURL, 
    email: email,
    urls: urlDatabase, 
    longURL: longURL
  };
  if (userCookie === urlDatabase[shortURL].userID) {
    res.render("urls_show", templateVars);
  } else {
    res.send('You are not authorized to edit this URL. Go back to the <a href="/">homepage</a>.')
  }
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
  urlDatabase[shortURL].url = newURL;
  res.redirect('/urls');
});

// redirect to full URL from shortURL
app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let findURL = (short, obj) => {
    for (prop in obj) {
      if (prop === short) {
        return true;
      } else {
        return false;
      }
    }
  }
  if (!findURL(shortURL)) {
    res.send('This is not a valid short URL. Please try <a href="/">again</a>.');
  } else {
    let longURL = urlDatabase[shortURL].url;
    res.redirect(302, longURL);
  }
});

// Login page
app.get('/login', (req, res) => {
  let userCookie = req.session.user_id;
  let email = findEmail(userCookie, "id", "email", users);
  let templateVars = {
    cookies: userCookie,
    email: email
  };
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
    if (bcrypt.compareSync(req.body.password,currentUser.password)) {
      req.session.user_id = currentUser.id;
      res.redirect('/urls');
    } else {
      res.status(403).send('Wrong password. Please try <a href="/login">again</a>.')
    }
  }
});

// Logout button in header
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});