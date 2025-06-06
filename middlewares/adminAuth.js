// middleware/auth.js
function isAdminLoggedIn(req, res, next) {
  if (req.session && req.session.adminId) {
    return next();
  }
  res.redirect("/admin");
}

module.exports = isAdminLoggedIn;
