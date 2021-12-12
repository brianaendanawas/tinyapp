const express = require("express");
const app = express();
const PORT = 8080;
const cookieParser = require("cookie-parser");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

function generateRandomString() {
  let string = Math.random().toString(36).substr(2, 6);
  return string;
}

// function to check if email is already in the users object 
function checkForExistingEmail(email) {
  for (const user in users) {
    if (email === users[user].email) {
      return users[user].id;
    }
  }
  return false;
};

function urlsForUser(id) {
  let urlData = {};
  for (const url in urlDatabase) {
    if (id === urlDatabase[url].userID) {
      urlData[url] = urlDatabase[url];
    }
  }
  return urlData;
}

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    //password: "purple-monkey-dinosaur"
    password: "hi"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.redirect("/login");
  }
  const templateVars = { user: users[req.cookies["user_id"]], urls: urlsForUser(req.cookies["user_id"]) };
  res.render("urls_index", templateVars);
});

// only registered and logged in users can create new URLs
app.get("/urls/new", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.redirect("/login");
  } 
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.cookies["user_id"] };
  res.redirect(`/urls/`);
});

//handles shortURL requests and redirects to longURL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params["shortURL"]]["longURL"];
  if (!longURL) {
    res.send("Error, URL not found.");
  }
  res.redirect(longURL);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]["longURL"] };
  res.render("urls_show", templateVars);
}); 

app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL]["longURL"] = req.body["longURL"];
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// updates the URL resource
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

// sets a cookie named user_id and redirects to the /urls page 
app.post("/login", (req, res) => {
  if (!checkForExistingEmail(req.body["email"])) {
    return res.status(403).send("A user with this email was not found.");
  }
  const id = checkForExistingEmail(req.body["email"]);
  if (users[id].password !== req.body["password"]) {
    return res.status(403).send("Password is incorrect.");
  }
  res.cookie('user_id', id);
  res.redirect("/urls");
});

// GET /login endpoint that responds with the new login form template 
app.get("/login", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("login", templateVars);
});

// clears user_id cookie 
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

// create endpoint for register 
app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("register", templateVars);
});

// endpoint that handles the registration form data 
app.post("/register", (req, res) => {
  if (!(req.body["email"]) || !(req.body["password"])) {
    return res.status(400).send("Email or password invalid");
  } else if (checkForExistingEmail(req.body["email"])) {
    return res.status(400).send("A user with this email already exists");
  } 
  const newID = generateRandomString();
  const user = { id: newID, email: req.body["email"], password: req.body["password"] };
  users[newID] = user;
  res.cookie('user_id', newID);
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
}); 