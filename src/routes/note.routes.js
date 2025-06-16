import { Router } from "express";
import {
  createNote,
  deleteNote,
  getNoteById,
  getNotes,
  updateNote,
} from "../controllers/note.controllers.js";
import { checkPermission } from "../middlewares/permission.js";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import { UserRolesEnum } from "../utils/constants.js";

const router = Router();

router.post(
  "/:pid/create",
  isLoggedIn,
  checkPermission([UserRolesEnum.ADMIN]),
  createNote,
);
router.get(
  "/:pid/all",
  isLoggedIn,
  checkPermission([UserRolesEnum.ADMIN]),
  getNotes,
);
router.get(
  "/:pid/note/:nid",
  isLoggedIn,
  checkPermission([UserRolesEnum.ADMIN]),
  getNoteById,
);
router.patch(
  "/:pid/note/:nid/update",
  isLoggedIn,
  checkPermission([UserRolesEnum.ADMIN]),
  updateNote,
);
router.delete(
  "/:pid/note/:nid/delete",
  isLoggedIn,
  checkPermission([UserRolesEnum.ADMIN]),
  deleteNote,
);

export default router;
