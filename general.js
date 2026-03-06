const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function getAllBooks() {
  const response = await axios.get(`${BASE_URL}/`);
  return response.data;
}

async function getBookByISBN(isbn) {
  const response = await axios.get(`${BASE_URL}/isbn/${encodeURIComponent(isbn)}`);
  return response.data;
}

async function getBooksByAuthor(author) {
  const response = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`);
  return response.data;
}

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
