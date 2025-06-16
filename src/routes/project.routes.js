import { Router } from "express";
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectMembers,
  addMemberToProject,
  deleteMember,
  updateMemberRole,
} from "../controllers/project.controllers.js";
import { checkPermission } from "../middlewares/permission.js";
import { UserRolesEnum } from "../utils/constants.js";
import { isLoggedIn } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/create", isLoggedIn, createProject);
router.get("/all", isLoggedIn, getProjects);
router.get(
  "/:pid",
  isLoggedIn,
  checkPermission([UserRolesEnum.ADMIN]),
  getProjectById,
);
router.patch(
  "/:pid/update",
  isLoggedIn,
  checkPermission([UserRolesEnum.ADMIN, UserRolesEnum.MEMBER]),
  updateProject,
);
router.delete(
  "/:pid/delete",
  isLoggedIn,
  checkPermission([UserRolesEnum.ADMIN]),
  deleteProject,
);
router.get("/:pid/members", isLoggedIn, getProjectMembers);
router.post(
  "/:pid/member/add",
  isLoggedIn,
  checkPermission([UserRolesEnum.ADMIN]),
  addMemberToProject,
);
router.patch(
  "/:pid/member/:mid/update/role",
  isLoggedIn,
  checkPermission([UserRolesEnum.ADMIN]),
  updateMemberRole,
);
router.delete(
  "/:pid/member/:mid/delete",
  isLoggedIn,
  checkPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]),
  deleteMember,
);

export default router;
