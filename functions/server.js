const express = require('express');
const serverless = require('serverless-http');
const app = express();

// Add API routes here that don't require WebSockets
app.get('/.netlify/functions/server', (req, res) => {
  res.json({ message: 'Uno Online API' });
});

// Export the serverless function
module.exports.handler = serverless(app);
