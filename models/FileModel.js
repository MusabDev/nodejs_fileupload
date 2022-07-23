const mongoose = require("mongoose")

const FileSchema = mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    password: String,
    downloaded: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamp: true }
)

module.exports = mongoose.model("File", FileSchema)
