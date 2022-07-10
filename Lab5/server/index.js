const { ApolloServer, gql } = require('apollo-server');
const axios = require('axios');
const uuid = require('uuid');
const redis = require('redis');
const client = redis.createClient();
const bluebird = require('bluebird');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const typeDefs = gql`
    type Query {
        unsplashImages(pageNum: Int): [ImagePost]
        binnedImages: [ImagePost]
        userPostedImages: [ImagePost]
    }

    type ImagePost {
        id: ID!
        url: String!
        posterName: String!
        description: String
        userPosted: Boolean!
        binned: Boolean!
    }

    type Mutation {
        uploadImage(url: String!, description: String, posterName: String): ImagePost
        updateImage(
            id: ID!
            url: String
            posterName: String
            description: String
            userPosted: Boolean
            binned: Boolean
        ): ImagePost
        deleteImage(id: ID!): ImagePost
    }
`;
const resolvers = {
    Query: {
        unsplashImages: async (parent, args) => {
            const { data } = await axios.get(
                `https://api.unsplash.com/photos/?client_id=zZ5MPXs5PiJHPycc-_UEkgr6As1FH6e9wzE1aWkP0Y0&page=${args.pageNum}`
            );
            const binImages = (await client.lrangeAsync('binnedImages', 0, -1)).map(JSON.parse);
            return data.map((image) => {
                let bin = false;
                for (let i = 0; i < binImages.length; i++) {
                    if (binImages[i].id === image.id) {
                        bin = true;
                    }
                }
                return {
                    id: image.id,
                    url: image.urls.small,
                    posterName: image.user.name,
                    description: image.description,
                    userPosted: false,
                    binned: bin,
                };
            });
        },

        binnedImages: async (parent, args, context, info) => {
            let binnedImages = (await client.lrangeAsync('binnedImages', 0, -1)).map(JSON.parse);
            return binnedImages;
        },

        userPostedImages: async (parent, args, context, info) => {
            const userPostedImages = (await client.lrangeAsync('userPostedImages', 0, -1)).map(JSON.parse);
            const binImages = (await client.lrangeAsync('binnedImages', 0, -1)).map(JSON.parse);
            return userPostedImages.map((image) => {
                let bin = false;
                for (let i = 0; i < binImages.length; i++) {
                    if (binImages[i].id === image.id) {
                        bin = true;
                    }
                }
                return {
                    id: image.id,
                    url: image.url,
                    posterName: image.posterName,
                    description: image.description,
                    userPosted: image.userPosted,
                    binned: bin,
                };
            });
        },
    },

    Mutation: {
        uploadImage: async (parent, args, context, info) => {
            const image = {
                id: uuid.v4(),
                url: args.url,
                posterName: args.posterName,
                description: args.description,
                binned: false,
                userPosted: true,
            };
            await client.lpush('userPostedImages', JSON.stringify(image));
            return image;
        },

        updateImage: async (parent, args, context, info) => {
            const newImage = {
                id: args.id,
                url: args.url,
                posterName: args.posterName,
                description: args.description,
                binned: args.binned,
                userPosted: args.userPosted,
            };
            try {
                if (!newImage.userPosted) {
                    (await client.lrangeAsync('userPostedImages', 0, -1)).map((image) => {
                        image = JSON.parse(image);
                        if (image.id === args.id) {
                            client.lrem('userPostedImages', 0, JSON.stringify(image));
                        }
                    });
                }
                if (!newImage.binned) {
                    let oldPost;
                    (await client.lrangeAsync('binnedImages', 0, -1)).map((image) => {
                        image = JSON.parse(image);
                        if (image.id === args.id) {
                            oldPost = image;
                        }
                    });
                    if (oldPost) {
                        await client.lrem('binnedImages', 0, JSON.stringify(oldPost));
                    }
                } else if (newImage.binned) {
                    await client.lpush('binnedImages', JSON.stringify(newImage));
                }
            } catch (error) { }

            return newImage;
        },

        deleteImage: async (parent, args, context, info) => {
            let oldPost;
            (await client.lrangeAsync('userPostedImages', 0, -1)).map((image) => {
                image = JSON.parse(image);
                if (image.id === args.id) {
                    oldPost = image;
                }
            });
            if (oldPost) {
                await client.lrem('userPostedImages', 0, JSON.stringify(oldPost));
                (await client.lrangeAsync('binnedImages', 0, -1)).map((image) => {
                    image = JSON.parse(image);
                    if (image.id === args.id) {
                        client.lrem('binnedImages', 0, JSON.stringify(image));
                    }
                });
                return oldPost;
            } else {
                throw `Image with id ${args.id} not found`;
            }
        },
    },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
    console.log(`🚀  Server ready at ${url} 🚀`);
});
