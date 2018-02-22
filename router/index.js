module.exports = function(app) {  
  // here we list our individual sets of routes to use
  require('./routes/utils')(app);
  require('./routes/gifts')(app);
  require('./routes/promos')(app);
  require('./routes/contacts')(app);
  require('./routes/orders')(app);
};