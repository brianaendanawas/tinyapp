const express = require("express");
const app = express();
const PORT = 8080;
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");
const { getUserByEmail, generateRandomString } = require('./helpers');

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({ name: "session", secret: "purple-dinosaur" }));
app.set("view engine", "ejs");

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

const users = {};

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  if (!req.session["user_id"]) {
    res.redirect("/login");
  }
  const templateVars = { user: users[req.session["user_id"]], urls: urlsForUser(req.session["user_id"]) };
  res.render("urls_index", templateVars);
});

// only registered and logged in users can create new URLs
app.get("/urls/new", (req, res) => {
  if (!req.session["user_id"]) {
    res.redirect("/login");
  }
  const templateVars = { user: users[req.session["user_id"]] };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  if (!req.session["user_id"]) {
    res.redirect("/login");
  }
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.session["user_id"] };
  res.redirect(`/urls/${shortURL}`);
});

// handles shortURL requests and redirects to longURL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params["shortURL"]]["longURL"];
  res.redirect(longURL);
});

app.get("/urls/:shortURL", (req, res) => {
  let data = urlsForUser(req.session["user_id"]);
  if (!data.hasOwnProperty(req.params.shortURL)) {
    return res.status(403).send("You need to login to access this URL.");
  } else {
    const templateVars = { user: users[req.session["user_id"]], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]["longURL"] };
    res.render("urls_show", templateVars);
  }
});

app.post("/urls/:shortURL", (req, res) => {
  let data = urlsForUser(req.session["user_id"]);
  if (!data.hasOwnProperty(req.params.shortURL)) {
    return res.status(403).send("You do not have access to this URL.");
  } else {
    urlDatabase[req.params.shortURL]["longURL"] = req.body["longURL"];
    res.redirect("/urls");
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  let data = urlsForUser(req.session["user_id"]);
  if (!data.hasOwnProperty(req.params.shortURL)) {
    return res.status(403).send("You do not have access to this URL.");
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  }
});

// updates the URL resource
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

// GET /login endpoint that responds with the new login form template
app.get("/login", (req, res) => {
  const templateVars = { user: users[req.session["user_id"]] };
  res.render("login", templateVars);
});

// sets a cookie named user_id and redirects to the /urls page
app.post("/login", (req, res) => {
  if (!getUserByEmail(req.body["email"], users)) {
    return res.status(403).send("A user with this email was not found.");
  }
  const id = getUserByEmail(req.body["email"], users);
  if (!bcrypt.compareSync(req.body.password, users[id].password)) {
    return res.status(403).send("Password is incorrect.");
  }
  req.session["user_id"] = id;
  res.redirect("/urls");
});

// clears user_id cookie
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

// create endpoint for register
app.get("/register", (req, res) => {
  const templateVars = { user: users[req.session["user_id"]] };
  res.render("register", templateVars);
});

// endpoint that handles the registration form data
app.post("/register", (req, res) => {
  if (!(req.body["email"]) || !(req.body["password"])) {
    return res.status(400).send("Email or password invalid");
  } else if (getUserByEmail(req.body["email"], users)) {
    return res.status(400).send("A user with this email already exists");
  }
  const newID = generateRandomString();
  const user = { id: newID, email: req.body["email"], password: bcrypt.hashSync(req.body["password"], 10) };
  users[newID] = user;
  req.session["user_id"] = newID;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});