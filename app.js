const express = require('express');
const userRouter = require('./routes/userRoutes');
const app = express();

app.use(express.json())

app.get('/',(req,res)=>{
    res.send("Hello World!");
})
app.use(userRouter);


module.exports = app;