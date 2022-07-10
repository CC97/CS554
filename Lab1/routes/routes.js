const express = require('express');
const router = express.Router();
const data = require('../data');
const userData = data.user;
const blogData = data.blog;
const mongoCollections = require('../config/mongoCollections');
// const req = require('express/lib/request');
// const users = mongoCollections.user;
// const blogs = mongoCollections.blog;

/**
 * Type checking
 */
//Check string and empty
function isString(str, varName) {
    if (!str) throw `${varName} must be provided`;
    if (typeof str != "string") throw `Type is not String ${varName} is a ${typeof str}`;
    if (str.length == 0 || str.trim().length == 0) throw "${varName} is empty";
  }

function isPassword(str) {
    if (!str) throw `Password must be provided`;
    if (typeof str != "string") throw `Password must be a string`;
    if (str.trim().length == 0) throw `Password cannot just be empty spaces`;
    if (str.toLowerCase() != str.toLowerCase().replace(/\s+/g, "")) throw `Password cannot have spaces`;
  }

function isNumber(str) {
    if (
        /^\d+$/.test(str)
    ){
        return parseInt(str);
    }
    else throw 'Skip and take must be the number';
}

/**
 * User routes
 */
//signup
router.post('/blog/signup', async (req, res) => {
    try {
        if (!req.body) throw 'You must provide data to create a user';
        if(!req.body.name) throw 'You must provide name to create a user';
        if(!req.body.username) throw 'You must provide username to create a user';
        if(!req.body.password) throw 'You must provide password to create a user';
        isString(req.body.name);
        isString(req.body.username);
        isPassword(req.body.password);
    } catch (error) {
        res.status(400).json(error);
        return;
    }

    try {
        var newUser = await userData.createUser(
            req.body.name.trim(),
            req.body.username.toLowerCase().trim(),
            req.body.password.trim()
        );
        
        if(newUser.username == req.body.username.toLowerCase().trim()) {
            //res.redirect('/blog');
            res.status(200).json(newUser);
        } 
        else {
            res.status(500).send({message: 'Internal Server Error'});
        }
    } catch (error) {
        res.status(500).json(error);
    }
});
//login
router.post('/blog/login', async (req, res) => {
    try {
        if (!req.body) throw 'You must provide data to create a user'
        if(!req.body.username) throw 'You must provide username to create a user' 
        if(!req.body.password) throw 'You must provide password to create a user'

        isString(req.body.username);
        isPassword(req.body.password);
    } catch (error) {
        res.status(400).json(error);
        return;
    }

    try {
        var newUser = await userData.checkUser(
            req.body.username.toLowerCase().trim(),
            req.body.password.trim()
        );
        if(newUser.username == req.body.username.toLowerCase().trim())
        {
            req.session.user = { 
                _id: newUser._id,
                username: newUser.username
            };
            //res.redirect('/blog');
            res.status(200).json(newUser);
        }
    } catch (error) {
        res.status(500).json(error);
    }
});
//logout
router.get('/blog/logout', async (req, res) => {
    req.session.destroy();
    res.clearCookie('AuthCookie');
    res.status(200).json({message:'logout'});
  });

/**
 * Blog routes
 */
router.get('/blog', async (req, res) => {
    try {
        var allBlog = await blogData.getAllBlog();

        let showBlog = allBlog;
        if (!req.query.skip && !req.query.take){
            showBlog = allBlog.slice(0,20);
        }
        if (!req.query.skip && req.query.take){
            let take = isNumber(req.query.take);
            if (take <= 100)
                showBlog = allBlog.slice(0,take);
            else
                showBlog = allBlog.slice(0,100);
        }
        if (req.query.skip && !req.query.take){
            let skip = isNumber(req.query.skip);
            showBlog = allBlog.slice(skip, skip+20);
        }
        if (req.query.skip && req.query.take){
            let skip = isNumber(req.query.skip);
            let take = isNumber(req.query.take);
            if(take <= 100)
                showBlog = allBlog.slice(skip, skip+take);
            else
                showBlog = allBlog.slice(skip, skip+100)
        }

        res.status(200).json(showBlog);
        
    } catch (error) {
        res.status(500).json({message: error});
    }
});

router.get('/blog/:id', async (req, res) => {
    try {
        if (!req.params.id) throw "You must provide a blog ID";
        isString(req.params.id);
    } catch (error) {
        res.status(400).json(error);
        return;
    }
    
    try {
        var blog = await blogData.getBlogById(req.params.id.trim());
        res.status(200).json(blog);
    } catch (error) {
        res.status(404).json({message: 'No blog with that ID'});
    }
});

router.post('/blog', async (req, res) => {
    try {
        if (!req.session.user) throw 'You have to login your account before posting the blog';
        if (!req.body) throw 'You must provide content to post';
        if (!req.body.title) throw 'You must provide a title';
        if (!req.body.body) throw 'You must provide a body';

        isString(req.body.title);
        isString(req.body.body);
    } catch (error) {
        res.status(400).json(error);
        return;
    }

    try {
        var newBlog = await blogData.createBlog(
            req.body.title.trim(), 
            req.body.body.trim(), 
            req.session.user._id.trim(), 
            req.session.user.username.trim()
        );
        res.status(200).json(newBlog);
        
    } catch (error) {
        res.status(500).json({message: error});
    }
});

router.put('/blog/:id', async (req, res) => {
    try {
        if (!req.session.user) throw 'You have to login your account before posting the blog';
        if (!req.params.id) throw 'You must provide a blog Id';
        if (!req.body) throw 'You must provide content to post';
        if (!req.body.title) throw 'You must provide a title';
        if (!req.body.body) throw 'You must provide a body';

        isString(req.params.id);
        isString(req.body.title);
        isString(req.body.body);
    } catch (error) {
        res.status(400).json(error);
        return;
    }

    try {
        var blogDetail = await blogData.getBlogById(req.params.id.trim());
    } catch (error) {
        res.status(404).json({message: 'No blog with that ID'});
        return;
    }

    try {
        if (req.session.user._id != blogDetail.userThatPosted._id.toString()) throw 'You can only change the blog you posted';
        if(
            req.body.title.trim() == blogDetail.title &&
            req.body.body.trim() == blogDetail.body
        ) throw 'You must provide different detail';

        var updatedBlog = await blogData.updateBlog(
            req.params.id.trim(), 
            req.body.title.trim(), 
            req.body.body.trim()
        );

        res.status(200).json(updatedBlog);
    } catch (error) {
        res.status(500).json(error);
    }
});

router.patch('/blog/:id', async (req, res) => {
    try {
        if (!req.session.user) throw 'You have to login your account before posting the blog';
        if (!req.params.id) throw 'You must provide a blog Id';
        if (!req.body) throw 'You must provide content to post';
        if (!req.body.title && !req.body.body) throw 'You must provide a title or body';
        
        isString(req.params.id);
        if (req.body.title)
            isString(req.body.title);
        if (req.body.body)
            isString(req.body.body);
    } catch (error) {
        res.status(400).json(error);
        return;
    }
    try {
        var blogDetail = await blogData.getBlogById(req.params.id.trim());
    } catch (error) {
        res.status(404).json({message: 'No blog with that ID'});
        return;
    }

    try {
        if (req.session.user._id != blogDetail.userThatPosted._id.toString()) throw 'You can only change the blog you posted';

        var title, body;
        if (req.body.title)
            title = req.body.title.trim();
        else
            title = blogDetail.title.trim();
        if (req.body.body)
            body = req.body.body.trim();
        else
            body = blogDetail.body.trim();

        var updatedBlog = await blogData.updateBlog(
            req.params.id.trim(), 
            title, 
            body
        );

        res.status(200).json(updatedBlog);
    } catch (error) {
        res.status(500).json(error);
    }
});
/**
 * Comment routes
 */
router.post('/blog/:id/comments', async (req, res) => {
    try {
        if (!req.session.user) throw 'You have to login your account before posting the comment';
        if (!req.body) throw 'You must provide content to post';
        if (!req.body.comment) throw 'You must provide a comment';
        if (!req.params.id) throw 'You must provide a blogId';

        isString(req.params.id);
        isString(req.body.comment);
    } catch (error) {
        res.status(400).json(error);
        return;
    }

    try {
        var blogDetail = await blogData.getBlogById(req.params.id.trim());
    } catch (error) {
        res.status(404).json({message: 'No blog with that ID'});
        return;
    }

    try {
        var newComment = await blogData.createComment(
            req.params.id.trim(),
            req.body.comment.trim(),
            req.session.user._id.trim(),
            req.session.user.username.trim()
        );
        res.status(200).json(newComment);
    } catch (error) {
        res.status(500).json(error);
    }
});

router.delete('/blog/:blogId/:commentId', async (req, res) => {
    try {
        if (!req.session.user) throw 'You have to login your account first';
        if (!req.params.blogId) throw 'You must provide a blogId';
        if (!req.params.commentId) throw 'You must provide a commentId';

        isString(req.params.blogId);
        isString(req.params.commentId);
    } catch (error) {
        res.status(400).json(error);
        return;
    }

    try {
        var blogResult = await blogData.getBlogById(req.params.blogId.trim());
    } catch (error) {
        res.status(404).json({message: 'No blog with that ID'});
        return;
    }

    try {
        var comments = blogResult['comments'];
        var length = comments.length;
        if(length == 0) throw "No comment with that ID";
        for (let i = 0; i < length; i++){
            if (comments[i]['_id'].toString() == req.params.commentId){
                if (
                    comments[i]['userThatPostedComment']['_id'].toString() != req.session.user._id
                )
                throw "You can not delete other's comment";
            }
            else{
                if(i == length - 1) throw "No comment with that ID";
            }   
        }
    } catch (error) {
        res.status(404).json({message: error});
        return;
    }

    try {
        var result = await blogData.deleteCommentById(
            req.params.blogId,
            req.params.commentId,
            req.session.user._id
        )
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json(error);
    }


})




 module.exports = router;
