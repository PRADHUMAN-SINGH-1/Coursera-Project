const http = require('http');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;

const books = {
  '1': { isbn: '1', title: 'The Alchemist', author: 'Paulo Coelho', reviews: { init: 'Motivational classic' } },
  '2': { isbn: '2', title: 'Sapiens', author: 'Yuval Noah Harari', reviews: {} },
  '3': { isbn: '3', title: '1984', author: 'George Orwell', reviews: {} },
  '4': { isbn: '4', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', reviews: {} },
  '5': { isbn: '5', title: 'Pride and Prejudice', author: 'Jane Austen', reviews: {} },
  '6': { isbn: '6', title: 'To Kill a Mockingbird', author: 'Harper Lee', reviews: {} },
  '7': { isbn: '7', title: 'Moby-Dick', author: 'Herman Melville', reviews: {} },
  '8': { isbn: '8', title: 'Brave New World', author: 'Aldous Huxley', reviews: {} },
  '9': { isbn: '9', title: 'The Hobbit', author: 'J.R.R. Tolkien', reviews: {} },
  '10': { isbn: '10', title: 'The Catcher in the Rye', author: 'J.D. Salinger', reviews: {} }
};

const users = {};
const sessions = {};

const sendJson = (res, status, data) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data, null, 2));
};

const parseBody = (req) => new Promise((resolve) => {
  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    if (!body) return resolve({});
    try { return resolve(JSON.parse(body)); } catch (_) { return resolve({}); }
  });
});

const getUserFromAuth = (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  return token && sessions[token] ? sessions[token] : null;
};

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && pathname === '/') return sendJson(res, 200, books);

  if (req.method === 'GET' && pathname.startsWith('/isbn/')) {
    const isbn = decodeURIComponent(pathname.split('/')[2] || '');
    const book = books[isbn];
    return book ? sendJson(res, 200, book) : sendJson(res, 404, { message: 'Book not found' });
  }

  if (req.method === 'GET' && pathname.startsWith('/author/')) {
    const author = decodeURIComponent(pathname.split('/')[2] || '').toLowerCase();
    const result = Object.values(books).filter((b) => b.author.toLowerCase().includes(author));
    return sendJson(res, 200, result);
  }

  if (req.method === 'GET' && pathname.startsWith('/title/')) {
    const title = decodeURIComponent(pathname.split('/')[2] || '').toLowerCase();
    const result = Object.values(books).filter((b) => b.title.toLowerCase().includes(title));
    return sendJson(res, 200, result);
  }

  if (req.method === 'GET' && pathname.startsWith('/review/')) {
    const isbn = decodeURIComponent(pathname.split('/')[2] || '');
    const book = books[isbn];
    return book ? sendJson(res, 200, book.reviews) : sendJson(res, 404, { message: 'Book not found' });
  }

  if (req.method === 'POST' && pathname === '/register') {
    const { username, password } = await parseBody(req);
    if (!username || !password) return sendJson(res, 400, { message: 'Username and password are required' });
    if (users[username]) return sendJson(res, 409, { message: 'User already exists' });
    users[username] = { password };
    return sendJson(res, 201, { message: 'User successfully registered. Now you can login' });
  }

  if (req.method === 'POST' && pathname === '/login') {
    const { username, password } = await parseBody(req);
    if (!users[username] || users[username].password !== password) {
      return sendJson(res, 401, { message: 'Invalid username or password' });
    }
    const token = `${username}-token`;
    sessions[token] = username;
    return sendJson(res, 200, { message: 'Login successful!', token });
  }

  if (req.method === 'PUT' && pathname.startsWith('/review/')) {
    const username = getUserFromAuth(req);
    if (!username) return sendJson(res, 401, { message: 'Unauthorized' });
    const isbn = decodeURIComponent(pathname.split('/')[2] || '');
    const book = books[isbn];
    if (!book) return sendJson(res, 404, { message: 'Book not found' });
    const { review } = await parseBody(req);
    book.reviews[username] = review || 'No review text provided';
    return sendJson(res, 200, { message: 'Review added successfully', reviews: book.reviews });
  }

  if (req.method === 'DELETE' && pathname.startsWith('/review/')) {
    const username = getUserFromAuth(req);
    if (!username) return sendJson(res, 401, { message: 'Unauthorized' });
    const isbn = decodeURIComponent(pathname.split('/')[2] || '');
    const book = books[isbn];
    if (!book) return sendJson(res, 404, { message: 'Book not found' });
    delete book.reviews[username];
    return sendJson(res, 200, { message: 'Review deleted successfully!' });
  }

  return sendJson(res, 404, { message: 'Route not found' });
});

server.listen(PORT, () => {
  console.log(`Server started on ${PORT}`);
});
