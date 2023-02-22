const express = require("express")
const { createPost, getAllPosts, deletePosts,  } = require("../Controller/Post")


const router = express.Router()



router.route('/createPost').get(createPost)
router.route('/getposts').get(getAllPosts)
router.route('/deleteposts').get(deletePosts)


module.exports = router
