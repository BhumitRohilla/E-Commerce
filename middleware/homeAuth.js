function homeAuth(req,res,next){
    console.log(req.session);
    if(req.session.is_logged_in && req.session.user.isVarified){
        next();
    }else if(req.session.is_logged_in){
        res.statusCode = 401;
        res.send("Please Varify Your Account");
    }else{

        res.redirect('/login');
    }
}

module.exports = homeAuth;