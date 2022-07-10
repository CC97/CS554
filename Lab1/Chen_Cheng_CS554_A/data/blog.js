const mongoCollections = require("../config/mongoCollections");
const users = mongoCollections.user;
const blogs = mongoCollections.blog;
let { ObjectId } = require("mongodb");

/**
 * Type checking
 */
//Check string and empty
 function isString(str, varName) {
    if (!str) throw `${varName} must be provided`;
    if (typeof str != "string") throw `Type is not String ${varName} is a ${typeof str}`;
    if (str.length == 0 || str.trim().length == 0) throw "${varName} is empty";
  }
/**
 * Export function
 */
module.exports = {
    /**
     * Blog
     */
    async createBlog(title, body, userId, username) {
        if (!title || !body || !userId || !username) throw 'You must provide title, body, user Id and username';
        isString(title, "Title");
        isString(body, "Body");
        isString(userId, "User ID");
        isString(username, "User name");

        //create blog
        let newBlog = {
            title: title,
            body: body,
            userThatPosted: {
                _id: ObjectId(userId.trim()),
                username: username
            },
            comments: []
        }

        const blogCollection = await blogs();
        const insertInfo = await blogCollection.insertOne(newBlog);
        if(insertInfo.insertedCount === 0) throw `Could not create blog`;

        const newId = insertInfo.insertedId.toString();
        const blog = await this.getBlogById(newId);
        blog._id = blog._id.toString();

        return blog;
    },
    async getAllBlog() {
        //get all blog
        const blogCollection = await blogs();
        const blogList = await blogCollection.find({}).toArray();

        if(blogList === null) throw `No blogs in the database`;
        for (let i of blogList) {
            i._id = i._id.toString();
        }
        
        return blogList;
    },
    async getBlogById(blogId) {
        if (!blogId) throw 'You must provide a blog Id';
        isString(blogId, "Blog ID");
        let objBlogId = ObjectId(blogId.trim());

        //get blog
        const blogCollection = await blogs();
        const blog = await blogCollection.findOne({ _id: objBlogId});

        if(blog === null) throw `No blogs with the id of ${blogId}`;
        blog._id = blog._id.toString();

        return blog;
    },
    async updateBlog(blogId, title, body) {
        if(!blogId || !title || !body) throw 'You must provide blog id, title and body';
        isString(blogId, "Blog ID");
        isString(title, "Title");
        isString(body, "Body");

        const blogCollection = await blogs();
        const updatedBlog = {
            title: title,
            body: body
        };

        var objBlogId = ObjectId(blogId);
        const updatedInfo = await blogCollection.updateOne(
            { _id: objBlogId },
            { $set: updatedBlog}
        );
        if (updatedInfo.modifiedCount === 0) throw 'could not update successfully';
        
        return await this.getBlogById(blogId);
    },
    /**
     * Comment
     */
    async createComment(blogId, comment, userId, username) {
        isString(blogId, "Blog ID");
        isString(userId, "User ID");
        isString(username, "Username");
        isString(comment,"Comment");

        let objBlogId = ObjectId(blogId.trim());
        let objUserId = ObjectId(userId.trim());

        let newComment = {
            _id: new ObjectId(),
            userThatPostedComment: {
                _id: objUserId,
                username: username
            },
            comment: comment
        }

        const blogCollection = await blogs();
        const blogResult = await blogCollection.findOne({ _id: objBlogId });
        if (blogResult === null) throw 'No blog with that ID';

        blogResult['comments'].push(newComment);

        const updatedInfo = await blogCollection.updateOne(
            { _id: objBlogId },
            { $set: blogResult}
        );
        if (updatedInfo.modifiedCount === 0) {
            throw 'could not update successfully';
        }

        return blogResult;
    },
    async deleteCommentById(blogId, commentId, userId){
        isString(blogId, "Blog ID");
        isString(commentId, "Comment ID");
        isString(userId, "User ID");

        let objBlogId = ObjectId(blogId.trim());
        let objUserId = ObjectId(userId.trim());

        const blogCollection = await blogs();
        const blogResult = await this.getBlogById(blogId);

        var comments = blogResult['comments'];
        let length = comments.length;
        for (let i = 0; i < length; i++){
            if (comments[i]['_id'].toString() == commentId){
                if (
                    comments[i]['userThatPostedComment']['_id'].toString() == userId
                ){
                    comments.splice(i,1);
                    break;
                }
                else 
                    return "You can not delete other's comment";
            }
        }
        const updatedBlog = {
            comments: comments
        }

        const updatedInfo = await blogCollection.updateOne(
            { _id: objBlogId },
            { $set: updatedBlog}
        );
        if (updatedInfo.modifiedCount === 0) {
            throw 'could not update successfully';
        }

        return 'Delete successfully';
    }
}