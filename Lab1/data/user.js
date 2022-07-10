const mongoCollections = require("../config/mongoCollections");
const users = mongoCollections.user;
let { ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");
const saltRounds = 16;

/**
 * Type Checking
 */
//Check string and empty
function isString(str, varName) {
    if (!str) throw `${varName} must be provided`;
    if (typeof str != "string") throw `Type is not String ${varName} is a ${typeof str}`;
    if (str.length == 0 || str.trim().length == 0) throw "${varName} is empty";
  }
//Check objectId
function isObjectId(a) {
    if (/^[0-9a-fA-F]{24}$/.test(a) != true) throw "objectId is not valid";
  }

function isPassword(str) {
    if (!str) throw `Password must be provided`;
    if (typeof str != "string") throw `Password must be a string`;
    if (str.trim().length == 0) throw `Password cannot just be empty spaces`;
    if (str.toLowerCase() != str.toLowerCase().replace(/\s+/g, "")) throw `Password cannot have spaces`;
  }
/**
 * Export Function
 */
module.exports = {
    //sign up
    async createUser(name, username, password) {
        if (arguments.length != 3) throw "Please only input name, user name and password";

        isString(name, "Name");
        isString(username, "User name");
        isString(password, "Password");
        
        isPassword(password);
        username = username.toLowerCase().trim();
        password = password.trim();

        //check username which is unique
        const userCollection = await users();
        const otherUser = await userCollection.findOne({ username: username });
        if (otherUser != null) throw `There is already a user with that username: ${username}`;

        // encrypt
        const hash = await bcrypt.hash(password, saltRounds);

        //create user
        let newUser = {
            name: name,
            username: username,
            password: hash
        };

        
        const insertInfo = await userCollection.insertOne(newUser);
        if (insertInfo.insertedCount === 0) throw `Could not create user`;

        const newId = insertInfo.insertedId.toString();
        const user = await this.getUserById(newId);
        user._id = user._id.toString();
        delete user.password;

        return user;
    },
    //login
    async checkUser(username, password) {
        isString(username, "User name");
        isString(password, "Password");

        isPassword(password);
        username = username.toLowerCase();

        // find user
        const userCollection = await users();
        const user = await userCollection.findOne({ username: username });
        if (user === null) throw `Either the username or password is invalid`;

        // check provided password is correct
        let compare = false;
        try {
            compare = await bcrypt.compare(password, user.password);
        } catch (e) {

        }
        delete user.password;
        if (compare) {
            return user;
        } else {
            throw `Either the username or password is invalid`;
        }
    },
    async getUserById(userId) {
        isString(userId, "User ID");
        let parsedId;
        try {
          parsedId = ObjectId(userId.trim());
        } catch (e) {
          throw e.message;
        }
    
        // get user
        const userCollection = await users();
        const user = await userCollection.findOne({ _id: parsedId });
    
        if (user === null) throw `No user with the id of ${userId}`;
        user._id = user._id.toString();
        return user;
      }
}