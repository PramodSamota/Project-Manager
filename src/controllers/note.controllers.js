import { asyncHandler } from "../utils/async-handler.js";
import { ProjectNote } from "../models/note.models.js";
import { ApiError } from "../utils/api-error.js";
import { validateNoteData } from "../validators/note.validator.js";
import { handleZodError } from "../utils/handleZodError.js";
import { ApiResponse } from "../utils/api-response.js";

import mongoose from "mongoose";


const getNotes = asyncHandler(async (req, res) => {
  const { pid } = req.params;


  // find project
  const notes = await ProjectNote.find({
    project: new mongoose.Types.ObjectId(pid),
  }).populate({
    path: "createdBy",

    select: "username email avatar fullname",
  });

  if (!notes) {
    throw new ApiError(404, "notes not feteched");
  }

  res.status(200).json(200, notes, "notes feteched Successfully");
});

const getNoteById = asyncHandler(async (req, res) => {
  const { nid } = req.params;

  const note = await ProjectNote.findById(nid).populate({

    path: "createdBy",
    select: "fullname username avatar",
  });

  if (!note) {
    throw new ApiError(404, "Note not found");

  }

  res.status(200).json(200, note, "note feteched successfully");
});

const createNote = asyncHandler(async (req, res) => {
  const { pid } = req.params;

  const { userId } = req.user._id;

  if (!userId) {
    throw new ApiError(400, "projectId is wronge");
  }


  //TODO:find project

  const { content } = handleZodError(validateNoteData(req.body));

  if (!pid) {
    throw new ApiError(400, "projectId is wronge");
  }

  const note = await ProjectNote.create({

    project: new mongoose.Types.ObjectId(pid),
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
  const { nid } = req.params;

  const { content } = handleZodError(validateNoteData(req.body));


  //TODO: validate note find by id

  if (!nid) {
    throw new ApiError(404, "notes id not define");
  }

  const updatedNote = await ProjectNote.findByIdAndUpdate(nid, content, {
    new: true,
  });

  if (updateNote) {
    throw new ApiError(400, "note is not update");
  }

  res
    .status(200)
    .json(new ApiResponse(200, updatedNote, "Note is update successfully"));
});

const deleteNote = asyncHandler(async (req, res) => {
  const { nid } = req.params;

  if (!nid) {
    throw new ApiError(400, "notes id is not correct");
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
