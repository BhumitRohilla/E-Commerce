function userAuth(req,res,next){
    if(req.session.is_logged_in){
        res.redirect('/home')
    }else{
        next();
        return
    }
}

module.exports =userAuth ;