require("dotenv").config()
const express = require("express")
const multer = require("multer")
const mongoose = require("mongoose")
const File = require("./models/FileModel")
const bcrypt = require("bcrypt")

const app = express()
const upload = multer({ dest: "uploads/" })
const PORT = process.env.PORT || 3000
app.use(express.urlencoded({ extended: true }))

app.set("view engine", "ejs")

app.get("/", (req, res) => {
  res.render("index")
})

app.post("/upload", upload.single("file"), async (req, res) => {
  const fileInfo = {
    filename: req.file.filename,
    originalName: req.file.originalname,
    path: req.file.path,
  }

  // Getting password
  if (req.body.password !== null && req.body.password !== "") {
    fileInfo.password = await bcrypt.hash(req.body.password, 10)
  }

  // Inserting data to mongodb
  const createdFile = await File.create(fileInfo)

  res.render("index", {
    file: {
      downloadLink: `${req.headers.origin}/${createdFile._id}`,
    },
  })
})

app.get("/:id", async (req, res) => {
  try {
    const file = await File.findById(req.params.id)
    res.render("download", {
      file: {
        password: file.password !== undefined,
        originalName: file.originalName,
        downloadLink: `/download/${file._id}`,
        downloaded: file.downloaded,
      },
    })
  } catch {
    res.render("download")
  }
})

app.route("/download/:id").get(handleDownload).post(handleDownload)

async function handleDownload(req, res) {
  try {
    const file = await File.findById(req.params.id)

    // Checking password
    if (file.password !== undefined) {
      const checkPassword = await bcrypt.compare(
        req.body.password,
        file.password
      )
      if (!checkPassword) {
        res.render("download", {
          file: {
            password: file.password !== undefined,
            originalName: file.originalName,
            downloadLink: `/download/${file._id}`,
            downloaded: file.downloaded,
          },
          alert: { type: "danger", text: "Password is incorrect." },
        })
        return
      }
    }

    // Updating download count
    file.downloaded++
    file.save()
    // Downloading file
    res.download(file.path, file.originalName)
  } catch (error) {
    res.render("download", {
      alert: { type: "danger", text: error },
    })
  }
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`))
  })
  .catch((error) => {
    console.log(`Failed to connect MongoDB: ${error}`)
  })
