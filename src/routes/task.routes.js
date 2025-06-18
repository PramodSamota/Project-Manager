import { Router } from "express";
import {
  createSubTask,
  createTask,
  deleteSubTask,
  getTaskById,
  getTasks,
  updateSubTask,
  updateTask,
} from "../controllers/task.controllers.js";
import { checkPermission } from "../middlewares/permission.js";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import { UserRolesEnum } from "../utils/constants.js";
const router = Router();

router.post("/:pid/create", isLoggedIn, createTask);
router.get("/:pid/task/:tid", isLoggedIn, getTaskById);
router.get("/:pid/all", isLoggedIn, getTasks);
router.patch(
  "/:pid/task/:tid/update",
  isLoggedIn,
  checkPermission(UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN),
  updateTask,
);

router.post(
  "/:pid/task/:tid/subtask/create",
  isLoggedIn,
  checkPermission(UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN),
  createSubTask,
);

router.patch(
  "/:pid/task/:tid/subtask/:sid/update",
  isLoggedIn,
  checkPermission(UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN),
  updateSubTask,
);
router.delete(
  "/:pid/task/:tid/subtask/:sid/delete",
  isLoggedIn,
  checkPermission(UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN),
  deleteSubTask,
);

export default router;
