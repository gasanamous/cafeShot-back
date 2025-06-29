/**
 * App review router: this router is for handling and serving requests of rating our site
 */
import express from 'express'
import * as reviewControlles from '../Controllers/appReview.controller.js'
const appReviewRouter = express.Router()

// User want to rate our application? Use this API
appReviewRouter.post('/new', reviewControlles.newRatingController)

// get first five feedback's 
appReviewRouter.get('/', reviewControlles.getTopReview)
export { appReviewRouter }