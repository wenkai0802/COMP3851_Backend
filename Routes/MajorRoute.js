const MajorController = require("../Controller/MajorController");
const authenticate = require("../Middleware/authenticate");
const MajorRouter = require("express").Router();
MajorRouter.get("/:majorId", MajorController.getMajorById);

MajorRouter.route("/")
  .get(MajorController.getMajor)
  .post(MajorController.addMajor)
  .delete(MajorController.deleteMajor)
  .put(MajorController.updateMajor);
MajorRouter.route("/:majorId/course")
  .get(MajorController.getMajorCourse)
  .post(MajorController.addMajorCourse)
  .delete(MajorController.deleteMajorCourse);

module.exports = MajorRouter;
