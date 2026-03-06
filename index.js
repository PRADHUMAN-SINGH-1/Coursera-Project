const http = require('http');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;

const books = {
  '1': { isbn: '1', title: 'The Alchemist', author: 'Paulo Coelho', reviews: { admin: 'A timeless inspirational classic.' } },
  '2': { isbn: '2', title: 'Sapiens', author: 'Yuval Noah Harari', reviews: { demo: 'Great read' } },
  '3': { isbn: '3', title: '1984', author: 'George Orwell', reviews: {} },
  '4': { isbn: '4', title: 'To Kill a Mockingbird', author: 'Harper Lee', reviews: {} },
  '5': { isbn: '5', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', reviews: {} },
  '6': { isbn: '6', title: 'Pride and Prejudice', author: 'Jane Austen', reviews: {} },
  '7': { isbn: '7', title: 'The Catcher in the Rye', author: 'J.D. Salinger', reviews: {} },
  '8': { isbn: '8', title: 'Moby-Dick', author: 'Herman Melville', reviews: {} },
  '9': { isbn: '9', title: 'Brave New World', author: 'Aldous Huxley', reviews: {} },
  '10': { isbn: '10', title: 'The Hobbit', author: 'J.R.R. Tolkien', reviews: {} }
};

const users = {};
const sessions = {};

const send = (res, status, data) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data, null, 2));
};

const collectBody = (req) => new Promise((resolve) => {
  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    try { resolve(body ? JSON.parse(body) : {}); }
    catch (_) { resolve({}); }
  });
});

const getUserFromAuth = (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  return token && sessions[token] ? sessions[token] : null;
};

const getIsbnFromPath = (path) => {
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'review' && parts[1]) return decodeURIComponent(parts[1]);
  if (parts[0] === 'customer' && parts[1] === 'auth' && parts[2] === 'review' && parts[3]) return decodeURIComponent(parts[3]);
  return '';
};

const isReviewMutationPath = (path) => path.startsWith('/review/') || path.startsWith('/customer/auth/review/');

const loginResponse = (username) => {
  const token = `${username}-token`;
  sessions[token] = username;
  return { message: 'Login successful!', token };
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  if (req.method === 'GET' && path === '/') return send(res, 200, books);

  if (req.method === 'GET' && path.startsWith('/isbn/')) {
    const isbn = decodeURIComponent(path.split('/')[2] || '');
    const book = books[isbn];
    return book ? send(res, 200, book) : send(res, 404, { message: 'Book not found' });
  }

  if (req.method === 'GET' && path.startsWith('/author/')) {
    const author = decodeURIComponent(path.split('/')[2] || '').toLowerCase();
    const filtered = Object.values(books).filter((book) => book.author.toLowerCase().includes(author));
    return send(res, 200, filtered);
  }

  if (req.method === 'GET' && path.startsWith('/title/')) {
    const title = decodeURIComponent(path.split('/')[2] || '').toLowerCase();
    const filtered = Object.values(books).filter((book) => book.title.toLowerCase().includes(title));
    return send(res, 200, filtered);
  }

  if (req.method === 'GET' && path.startsWith('/review/')) {
    const isbn = decodeURIComponent(path.split('/')[2] || '');
    const book = books[isbn];
    return book ? send(res, 200, book.reviews) : send(res, 404, { message: 'Book not found' });
  }

  if (req.method === 'POST' && path === '/register') {
    const { username, password } = await collectBody(req);
    if (!username || !password) return send(res, 400, { message: 'Username and password are required' });
    if (users[username]) return send(res, 409, { message: 'User already exists' });
    users[username] = { password };
    return send(res, 201, { message: 'User successfully registered. Now you can login' });
  }

  if (req.method === 'POST' && (path === '/customer/login' || path === '/login')) {
    const { username, password } = await collectBody(req);
    if (!users[username] || users[username].password !== password) {
      return send(res, 401, { message: 'Invalid username or password' });
    }
    return send(res, 200, loginResponse(username));
  }

  if (req.method === 'PUT' && isReviewMutationPath(path)) {
    const username = getUserFromAuth(req);
    if (!username) return send(res, 401, { message: 'Unauthorized' });
    const isbn = getIsbnFromPath(path);
    const book = books[isbn];
    if (!book) return send(res, 404, { message: 'Book not found' });
    const { review } = await collectBody(req);
    book.reviews[username] = review || 'No review text provided';
    return send(res, 200, { message: 'Review added successfully', reviews: book.reviews });
  }

  if (req.method === 'DELETE' && isReviewMutationPath(path)) {
    const username = getUserFromAuth(req);
    if (!username) return send(res, 401, { message: 'Unauthorized' });
    const isbn = getIsbnFromPath(path);
    const book = books[isbn];
    if (!book) return send(res, 404, { message: 'Book not found' });
    delete book.reviews[username];
    return send(res, 200, { message: 'Review deleted successfully!' });
  }

  return send(res, 404, { message: 'Route not found' });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
