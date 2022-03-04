function authenticate(req, res, next) {
  if (!req.session.user) res.status(403).send("Unauthorized");
  else next();
}
module.exports = authenticate;
