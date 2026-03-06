const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Task 10: async/await
async function getAllBooks() {
  const response = await axios.get(`${BASE_URL}/`);
  return response.data;
}

// Task 11: promises
function getBookByISBN(isbn) {
  return axios.get(`${BASE_URL}/isbn/${encodeURIComponent(isbn)}`).then((response) => response.data);
}

// Task 12: async/await
async function getBooksByAuthor(author) {
  const response = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`);
  return response.data;
}

// Task 13: async/await
async function getBooksByTitle(title) {
  const response = await axios.get(`${BASE_URL}/title/${encodeURIComponent(title)}`);
  return response.data;
}

module.exports = {
  getAllBooks,
  getBookByISBN,
  getBooksByAuthor,
  getBooksByTitle
};
