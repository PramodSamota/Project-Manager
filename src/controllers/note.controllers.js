import { asyncHandler } from "../utils/async-handler.js";
import { ProjectNote } from "../models/note.models.js";
import { ApiError } from "../utils/api-error.js";
import { validateNoteData } from "../validators/note.validator.js";
import { handleZodError } from "../utils/handleZodError.js";
import { ApiResponse } from "../utils/api-response.js";
import { validateObjectId } from "../utils/helper.js";
import { Project } from "../models/project.models.js";

const getNotes = asyncHandler(async (req, res) => {
  const { pid } = req.params;

  validateObjectId(pid, "project");

  const project = await Project.findById(pid);

  if (!project) {
    throw new ApiError(404, "Project Not Found");
  }

  const notes = await ProjectNote.find({
    project: pid,
  }).populate({
    path: "createdBy",
    select: "username email ",
  });

  if (!notes) {
    throw new ApiError(404, "notes not feteched");
  }

  res
    .status(200)
    .json(new ApiResponse(200, notes, "notes feteched Successfully"));
});

const getNoteById = asyncHandler(async (req, res) => {
  const { nid } = req.params;

  const currentnote = await ProjectNote.findById(nid);

  if (!currentnote) {
    throw new ApiError(404, "note not found");
  }

  const note = await ProjectNote.findById(nid).populate({
    path: "createdBy",
    select: "fullname username ",
  });

  if (!note) {
    throw new ApiError(404, "Note not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, note, "note feteched successfully"));
});

const createNote = asyncHandler(async (req, res) => {
  const { pid } = req.params;
  validateObjectId(pid, "Project");

  const userId = req.user._id;

  const project = await Project.findById(pid);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const { content } = handleZodError(validateNoteData(req.body));

  const note = await ProjectNote.create({
    project: pid,
    content: content,
    createdBy: userId,
  });

  if (!note) {
    throw new ApiError(400, "note not created");
  }

  res
    .status(201)
    .json(new ApiResponse(201, note, "note is created Successfully"));
});

const updateNote = asyncHandler(async (req, res) => {
  const { pid } = req.params;
  const { nid } = req.params;

  validateObjectId(pid, "Project");
  validateObjectId(nid, "Note");
  const { content } = handleZodError(validateNoteData(req.body));

  const project = await Project.findById(pid);

  if (!project) {
    throw new ApiError(404, "notes is not found");
  }

  const updatedNote = await ProjectNote.findByIdAndUpdate(
    nid,
    { project: pid, createdBy: req.user._id, content: content },
    {
      new: true,
    },
  );

  if (!updateNote) {
    throw new ApiError(400, "note is not update");
  }

  res
    .status(200)
    .json(new ApiResponse(200, updatedNote, "Note is update successfully"));
});

const deleteNote = asyncHandler(async (req, res) => {
  const { nid } = req.params;
  validateObjectId(nid, "Note");

  const note = await ProjectNote.findById(nid);

  if (!note) {
    throw new ApiError(400, "notes  is not correct");
  }

  const deletedNote = await ProjectNote.findByIdAndDelete(nid);

  if (!deletedNote) {
    throw new ApiError(404, "note is deleted successfully");
  }

  res
    .status(200)
    .json(new ApiResponse(200, deleteNote, "Note deleted successfully"));
});

export { createNote, deleteNote, getNoteById, getNotes, updateNote };
