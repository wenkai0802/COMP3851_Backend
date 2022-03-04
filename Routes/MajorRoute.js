const MajorController = require("../Controller/MajorController");
const authenticate = require("../Middleware/authenticate");
const MajorRouter = require("express").Router();
MajorRouter.get("/:majorId", MajorController.getMajorById);

MajorRouter.route("/")
  .get(MajorController.getMajor)
  .post(authenticate, MajorController.addMajor)
  .delete(authenticate, MajorController.deleteMajor)
  .put(authenticate, MajorController.updateMajor);
MajorRouter.route("/:majorId/course")
  .get(authenticate, MajorController.getMajorCourse)
  .post(authenticate, MajorController.addMajorCourse)
  .delete(authenticate, MajorController.deleteMajorCourse);

module.exports = MajorRouter;
