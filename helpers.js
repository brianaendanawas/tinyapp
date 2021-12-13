function getUserByEmail(email, users) {
  for (const user in users) {
    if (email === users[user].email) {
      return users[user].id;
    }
  }
  return undefined;
}

function generateRandomString() {
  let string = Math.random().toString(36).substr(2, 6);
  return string;
}

module.exports = { getUserByEmail, generateRandomString };