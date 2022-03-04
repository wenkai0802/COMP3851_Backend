const DegreeController = require("../Controller/DegreeController");
const authenticate = require("../Middleware/authenticate");
const DegreeRouter = require("express").Router();
DegreeRouter.get("/filterOptions", DegreeController.getFilterOptions);
DegreeRouter.get("/:degreeId", DegreeController.getDegreeById);

DegreeRouter.route("/")
  .get(DegreeController.getDegree)
  .post(authenticate, DegreeController.addDegree)
  .delete(authenticate, DegreeController.deleteDegree)
  .put(authenticate, DegreeController.updateDegree);
DegreeRouter.route("/:degreeId/course")
  .get(DegreeController.getDegreeCourse)
  .post(authenticate, DegreeController.addDegreeCourse)
  .delete(authenticate, DegreeController.deleteDegreeCourse);

module.exports = DegreeRouter;
