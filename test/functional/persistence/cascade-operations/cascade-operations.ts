import "reflect-metadata";
import {setupTestingConnections, closeConnections, reloadDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";
import {Photo} from "./entity/Photo";

describe("persistence > cascade operations", () => {

    let connections: Connection[];
    before(async () => connections = await setupTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadDatabases(connections));
    after(() => closeConnections(connections));

    describe("cascade insert", function() {

        it.only("should work perfectly", () => Promise.all(connections.map(async connection => {

            // create category
            const category1 = new Category();
            category1.name = "Category saved by cascades #1";

            // create photos
            const photo1 = new Photo();
            photo1.url = "http://me.com/photo";
            const photo2 = new Photo();
            photo2.url = "http://me.com/photo";

            // create post
            const post1 = new Post();
            post1.title = "Hello Post #1";
            post1.category = category1;
            post1.category.photos = [photo1, photo2];
            await connection.entityManager.persist(post1);

            console.log("********************************************************");

            const posts = await connection.entityManager
                .createQueryBuilder(Post, "post")
                .leftJoinAndSelect("post.category", "category")
                // .innerJoinAndSelect("post.photos", "photos")
                .getResults();

            posts[0].title = "Updated Post #1";

            console.log("********************************************************");
            console.log("posts: ", posts);

            // posts[0].category = null; // todo: uncomment to check remove
            console.log("removing post's category: ", posts[0]);
            await connection.entityManager.persist(posts[0]);

           /* await connection.entityManager.persist([photo1, photo2]);

            post1.photos = [photo1];
            await connection.entityManager.persist(post1);

            console.log("********************************************************");
            console.log("********************************************************");

            post1.photos = [photo1, photo2];

            await connection.entityManager.persist(post1);

            console.log("********************************************************");
            console.log("********************************************************");

            post1.title = "Updated Post";
            await connection.entityManager.persist(post1);*/

        })));

        it("should insert entity when cascade option is set", () => Promise.all(connections.map(async connection => {

            // create first category and post and save them
            const category1 = new Category();
            category1.name = "Category saved by cascades #1";

            const post1 = new Post();
            post1.title = "Hello Post #1";
            post1.category = category1;

            await connection.entityManager.persist(post1);

            // create second category and post and save them
            const category2 = new Category();
            category2.name = "Category saved by cascades #2";

            const post2 = new Post();
            post2.title = "Hello Post #2";
            post2.category = category2;

            await connection.entityManager.persist(post2);

            // now check
            const posts = await connection.entityManager.find(Post, {
                alias: "post",
                innerJoinAndSelect: {
                    category: "post.category"
                },
                orderBy: {
                    "post.id": "ASC"
                }
            });

            posts.should.be.eql([{
                id: 1,
                title: "Hello Post #1",
                category: {
                    id: 1,
                    name: "Category saved by cascades #1"
                }
            }, {
                id: 2,
                title: "Hello Post #2",
                category: {
                    id: 2,
                    name: "Category saved by cascades #2"
                }
            }]);
        })));

        it("should insert from inverse side when cascade option is set", () => Promise.all(connections.map(async connection => {

            // create first post and category and save them
            const post1 = new Post();
            post1.title = "Hello Post #1";

            const category1 = new Category();
            category1.name = "Category saved by cascades #1";
            category1.posts = [post1];

            await connection.entityManager.persist(category1);

            // create first post and category and save them
            const post2 = new Post();
            post2.title = "Hello Post #2";

            const category2 = new Category();
            category2.name = "Category saved by cascades #2";
            category2.posts = [post2];

            await connection.entityManager.persist(category2);

            // now check
            const posts = await connection.entityManager.find(Post, {
                alias: "post",
                innerJoinAndSelect: {
                    category: "post.category"
                },
                orderBy: {
                    "post.id": "ASC"
                }
            });

            posts.should.be.eql([{
                id: 1,
                title: "Hello Post #1",
                category: {
                    id: 1,
                    name: "Category saved by cascades #1"
                }
            }, {
                id: 2,
                title: "Hello Post #2",
                category: {
                    id: 2,
                    name: "Category saved by cascades #2"
                }
            }]);
        })));

    });

});