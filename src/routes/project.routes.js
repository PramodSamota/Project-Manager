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


import { isLoggedIn } from "../middlewares/auth.middleware.js";


const router = Router();

router.post("/create", isLoggedIn, createProject);
router.get("/all", isLoggedIn, getProjects);
router.get("/:pid", isLoggedIn, getProjectById);
router.put("/:pid/update", isLoggedIn, updateProject);
router.delete("/:pid/delete", isLoggedIn, deleteProject);
router.post("/:pid/member/add", isLoggedIn, addMemberToProject);
router.get("/:pid/members", isLoggedIn, getProjectMembers);
router.delete("/:pid/member/:mid/delete", deleteMember);
router.put("/:pid/member/:mid/update/role", isLoggedIn, updateMemberRole);

export default router;
