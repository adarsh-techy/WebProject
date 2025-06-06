const isAuthenticated = (req, res, next) => {
    
    if (req.session && req.session.userId) {
        return next();
    }
    res.redirect("/user/login");
};




module.exports = isAuthenticated;
