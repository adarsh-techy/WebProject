// api/concert.js
const express = require("express");
const Concert = require("../../models/concertModel");
const router = express.Router();
const mongoose = require("mongoose");

// Helper function to process image data in the specific format needed
const processImageData = (concert) => {
  const concertObj = concert.toObject();

  if (concertObj.concertImage?.data) {
    const base64String = concertObj.concertImage.data.toString("base64");
    concertObj.concertImage = {
      data: `Binary.createFromBase64('${base64String}', 0)`,
      contentType: concertObj.concertImage.contentType,
    };
  }

  if (concertObj.userprofileImage?.data) {
    const base64String = concertObj.userprofileImage.data.toString("base64");
    concertObj.userprofileImage = {
      data: `Binary.createFromBase64('${base64String}', 0)`,
      contentType: concertObj.userprofileImage.contentType,
    };
  }

  return concertObj;
};

router.post("/", async (req, res) => {
  try {
    const { concertImage, userprofileImage, ...otherFields } = req.body;

    const concert = await Concert.create({
      ...otherFields,
      concertImage: concertImage
        ? {
            data: Buffer.from(concertImage.data, "base64"),
            contentType: concertImage.contentType,
          }
        : null,
      userprofileImage: userprofileImage
        ? {
            data: Buffer.from(userprofileImage.data, "base64"),
            contentType: userprofileImage.contentType,
          }
        : null,
    });

    res.status(201).json(processImageData(concert));
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error creating concert", error: err.message });
  }
});

// GET /api/concerts/
router.get("/", async (req, res) => {
  try {
    const concerts = await Concert.find();
    const processedConcerts = concerts.map(processImageData);
    res.json(processedConcerts);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/concerts/:id
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid concert ID" });
    }

    const concert = await Concert.findById(req.params.id);
    if (!concert) {
      return res.status(404).json({ message: "Concert not found" });
    }

    res.json(processImageData(concert));
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid concert ID" });
    }

    const { concertImage, userprofileImage, ...otherFields } = req.body;

    const updatedConcert = await Concert.findByIdAndUpdate(
      req.params.id,
      {
        ...otherFields,
        ...(concertImage && {
          concertImage: {
            data: Buffer.from(concertImage.data, "base64"),
            contentType: concertImage.contentType,
          },
        }),
        ...(userprofileImage && {
          userprofileImage: {
            data: Buffer.from(userprofileImage.data, "base64"),
            contentType: userprofileImage.contentType,
          },
        }),
      },
      { new: true, runValidators: true }
    );

    if (!updatedConcert) {
      return res.status(404).json({ message: "Concert not found" });
    }

    res.json(processImageData(updatedConcert));
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error updating concert", error: err.message });
  }
});

// DELETE Concert
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid concert ID" });
    }

    const concert = await Concert.findByIdAndDelete(req.params.id);
    if (!concert) {
      return res.status(404).json({ message: "Concert not found" });
    }

    res.json({ message: "Concert deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
