// returns the user ID for the user with the email
function getUserByEmail(email, users) {
  for (const user in users) {
    if (email === users[user].email) {
      return users[user].id;
    }
  }
  return undefined;
}

// generates a random string for short URLs and user IDs
function generateRandomString() {
  let string = Math.random().toString(36).substr(2, 6);
  return string;
}

module.exports = { getUserByEmail, generateRandomString };