const express = require("express")
const { createPost, getAllPosts, deletePosts, tests, tests2, allCateGories,  } = require("../Controller/Post")


const router = express.Router()



// router.route('/createPost').get(createPost)
router.route('/getposts').get(getAllPosts).post(getAllPosts)
router.route('/deleteposts').get(deletePosts)
router.route('/all-categories').get(allCateGories)


router.route('/ronti').get(tests)


module.exports = router
