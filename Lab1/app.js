const userData = require('./data/user');
const blogData = require('./data/blog');

const express = require('express');
const app = express();
const configRoutes = require('./routes');
//const exphbs = require('express-handlebars');
const session = require('express-session');

const static = express.static(__dirname + '/public');
app.use('/public', static);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
//app.set('view engine', 'handlebars');

app.use(
    session({
        name: 'AuthCookie',
        secret: 'some secret string!',
        resave: false,
        saveUninitialized: true,
        //cookie: { maxAge: 60000 }
    })
);

// app.use(async (req, res, next) => {
//     let authenticated = ''
//     if(req.session.user)
//         authenticated = 'Authenticated User';
//     else
//         authenticated = 'Non-Authenticated User';
//     console.log(new Date().toUTCString(), req.method, req.originalUrl, authenticated);
//     next();
// });

/**
 * authentication middleware
 */
app.use('/blog', async (req, res, next) => {
    if (req.method == 'GET'){
        next();
    }
    else{
        if(!req.session.user){
            if(req.url == '/login' || req.url == '/signup'){
                next();
            }
            else if (req.method == "PUT" || req.method == "PATCH"){
                var blogDetail = await blogData.getBlogById(req.params.id.trim());
                if (req.session.user._id != blogDetail.userThatPosted._id.toString()){
                    return res.status(403).json({message: 'You can not change other blog'});
                }
                else{
                    next();
                }      
            }
            else if (req.method == "DELETE"){
                var blogResult = await blogData.getBlogById(req.params.blogId.trim());
                var comments = blogResult['comments'];
                var length = comments.length;
                if(length == 0) throw "No comment with that ID";
                for (let i = 0; i < length; i++){
                if (comments[i]['_id'].toString() == req.params.commentId){
                    if (
                        comments[i]['userThatPostedComment']['_id'].toString() != req.session.user._id
                    ){
                        return res.status(403).json({message: 'You can not change other comment'});
                    }
                    else{
                        next();
                    }
                }
                else{
                    if(i == length - 1) throw "No comment with that ID";
                }   
                }
            }
            else{
                return res.status(403).json({message: 'Please login your account first'});
            }
        }
        else{
            next();
        }
    }
});

configRoutes(app);

app.listen(3000, () => {
  console.log("We've now got a server!");
  console.log('Your routes will be running on http://localhost:3000');
})