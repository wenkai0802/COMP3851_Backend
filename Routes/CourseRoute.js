const CourseController = require("../Controller/CourseController.js");
const authenticate = require("../Middleware/authenticate");
const CourseRouter = require("express").Router();
CourseRouter.route("/")
  .get(CourseController.getCourseList)
  .post(authenticate, CourseController.addCourse)
  .put(authenticate, CourseController.updateCourse)
  .delete(authenticate, CourseController.deleteCourseById);
CourseRouter.get("/filterOptions", CourseController.getFilterOptions);
CourseRouter.route("/:courseId").get(CourseController.getCourseById);

CourseRouter.route("/:courseId/AssumedKnowledge")
  .get(CourseController.getAssumedKnowledge)
  .post(authenticate, CourseController.addAssumedKnowledge)
  .delete(authenticate, CourseController.deleteAssumedKnowledge);
CourseRouter.route("/:courseId/Availability")
  .get(CourseController.getCourseAvailability)
  .post(authenticate, CourseController.addCourseAvailability)
  .delete(authenticate, CourseController.deleteCourseAvailability);
module.exports = CourseRouter;
