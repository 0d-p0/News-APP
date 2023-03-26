const express = require("express")
const { createPost, getAllPosts, deletePosts, tests, tests2,  } = require("../Controller/Post")


const router = express.Router()



router.route('/createPost').get(createPost)
router.route('/getposts').get(getAllPosts)
router.route('/deleteposts').get(deletePosts)


router.route('/ronti').get(tests)


module.exports = router
