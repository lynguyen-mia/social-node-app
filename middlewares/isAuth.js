module.exports = (req, res, next) => {
  if (!req.session.isLoggedIn) {
    return res.status(403).json({ msg: "Unauthorized" });
  }
  next();
};
