//mongodb
require('./config/db');

const jwt = require('jsonwebtoken');

const app = require('express')();
const port = process.env.PORT || 3000;
const UserRouter = require('./api/User');

const blogRouter  = require('./routes/blog-routes');

//accpeting post form data

const bodyParser = require('express').json;
app.use(bodyParser());

app.use('/user',UserRouter)

app.use("/blog",blogRouter);

app.listen(port, () =>{
    console.log(`Server running on port ${port}`);
});