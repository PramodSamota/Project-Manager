import { Router } from "express";
import {
  createNote,
  deleteNote,
  getNoteById,
  getNotes,
  updateNote,
} from "../controllers/note.controllers.js";

import { isloggedIn } from "../middlewares/auth.middleware.js";
const router = Router();

router.post("/:pid/notes/create", isloggedIn, createNote);
router.get("/:pid/notes/all", getNotes);
router.get("/:pid/notes/:nid", getNoteById);
router.put("/:pid/notes/:nid/update", updateNote);
router.delete("/:pid/notes/:nid/delete", deleteNote);

export default router;
