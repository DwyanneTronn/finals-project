const { validationResult } = require("express-validator");

const getCoordsForAddress = require("../util/geocode");
const Journal = require("../models/journal");
const HttpError = require("../models/http-error");

const getEntryById = async (req, res, next) => {
  const entryId = req.params.pid;

  let entry;
  try {
    entry = await Journal.findById(entryId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find an entry.",
      500
    );
    return next(error);
  }

  if (!entry) {
    const error = new HttpError(
      "Could not find an entry for the provided id.",
      404
    );
    return next(error);
  }

  res.json({ entry: entry.toObject({ getters: true }) });
};

const getEntriesByUserId = async (req, res, next) => {
  console.log("=== FETCHING ENTRIES BY USER ID ===");
  const userId = req.params.uid;
  console.log("Fetching entries for user:", userId);
  console.log("User ID type:", typeof userId);
  
  // Ensure userId is a string for consistent querying
  const userIdString = String(userId);

  let entries;
  try {
    console.log("Query: Journal.find({ author: userIdString })");
    console.log("Query filter object:", { author: userIdString });
    entries = await Journal.find({ author: userIdString });
    console.log("Database result - Number of entries found:", entries.length);
    console.log("Database result - Entries:", entries);
    if (entries.length > 0) {
      console.log("First entry author field:", entries[0].author);
      console.log("Does this userIdString match entry.author?", entries[0].author === userIdString);
      console.log("Type comparison - userIdString:", typeof userIdString, "entry.author:", typeof entries[0].author);
    } else {
      console.log("No entries found. Checking if any entries exist in database...");
      const allEntries = await Journal.find({});
      console.log("Total entries in database:", allEntries.length);
      if (allEntries.length > 0) {
        console.log("Sample entry author:", allEntries[0].author);
        console.log("Requested userIdString:", userIdString);
      }
    }
  } catch (err) {
    console.log("Error fetching entries:", err.message);
    const error = new HttpError(
      "Fetching entries failed, please try again later",
      500
    );
    return next(error);
  }

  if (!entries || entries.length === 0) {
    console.log("No entries found for user:", userId);
    console.log("Returning empty array (this is expected if user has no entries)");
  } else {
    console.log("Found", entries.length, "entries, preparing response");
  }

  console.log("Sending response with entries");
  res.json({
    entries: entries.map((entry) => entry.toObject({ getters: true })),
  });
};

const createEntry = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { headline, journalText, locationName, author } = req.body;

  let coordinates;

  try {
    coordinates = await getCoordsForAddress(locationName);
  } catch (error) {
    return next(error);
  }

  const createdEntry = new Journal({
    headline,
    journalText,
    photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSpPkm3Hhfm2fa7zZFgK0HQrD8yvwSBmnm_Gw&s",
    locationName,
    coordinates: {
        latitude: coordinates.lat, 
        longitude: coordinates.lng
    },
    author,
  });

  try {
    await createdEntry.save();
  } catch (err) {
    const error = new HttpError("Creating entry failed, please try again", 500);
    return next(error);
  }

  res.status(201).json({ entry: createdEntry });
};

const updateEntry = async (req, res, next) => {
  console.log("=== UPDATE ENTRY REQUEST ===");
  console.log("Update payload received:", req.body);
  console.log("Request body received:", req.body);
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("Validation errors:", errors.array());
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { headline, journalText } = req.body;
  const entryId = req.params.pid;
  console.log("Entry ID from params:", entryId);
  console.log("Update data - headline:", headline, "journalText:", journalText);

  let entry;
  try {
    console.log("Attempting to find entry by ID:", entryId);
    entry = await Journal.findById(entryId);
    console.log("Entry found:", entry ? "Yes" : "No");
  } catch (err) {
    console.log("Error finding entry:", err.message);
    const error = new HttpError(
      "Something went wrong, could not update entry.",
      500
    );
    return next(error); 
  }

  if (!entry) {
    console.log("Entry not found for ID:", entryId);
    return next(new HttpError("Could not find entry for this id.", 404));
  }

  console.log("Updating entry fields...");
  entry.headline = headline;
  entry.journalText = journalText;

  try {
    console.log("Saving entry to database...");
    await entry.save();
    console.log("Entry saved successfully");
  } catch (err) {
    console.log("Error saving entry:", err.message);
    const error = new HttpError(
      "Something went wrong, could not update entry.",
      500
    );
    return next(error);
  }

  console.log("Sending success response");
  res.status(200).json({ entry: entry.toObject({ getters: true }) });
};

const deleteEntry = async (req, res, next) => {
  const entryId = req.params.pid;

  let entry;
  try {
    entry = await Journal.findById(entryId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete entry.",
      500
    );
    return next(error);
  }

  if (!entry) {
    return next(new HttpError("Could not find entry for this id.", 404));
  }

  try {
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete entry.",
      500
    );
    return next(error);
  }

  res.status(200).json({ message: "Deleted entry." });
};

exports.getEntryById = getEntryById;
exports.getEntriesByUserId = getEntriesByUserId;
exports.createEntry = createEntry;
exports.updateEntry = updateEntry;
exports.deleteEntry = deleteEntry;