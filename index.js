require('dotenv').config();
const express = require('express');
const app = express();

app.get('/',(req,res)=>{
    res.send("TEST");
})

app.listen(process.env.PORT,'127.0.0.1',function(){
    console.log(process.env.PORT);
});