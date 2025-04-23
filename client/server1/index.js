const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { exec } = require("child_process");
const path = require("path");

const app = express();
app.use(cors());

// Set up file upload
const upload = multer({ dest: "server/uploads/" });

// Route to handle file uploads
app.post("/upload", upload.single("file"), (req, res) => {
  const filePath = req.file.path;  // Path to uploaded file
  const reportPath = path.join(__dirname, "output", "report.pdf");  // Path where report will be saved

  // Run Python script for analysis
  exec(`python3 server/analyze_climate.py ${filePath}`, (error, stdout, stderr) => {
    if (error) {
      console.error("Python error:", stderr);
      return res.status(500).send("Model processing failed");
    }
    // Send the generated report after processing
    res.download(reportPath, "climate_report.pdf", (err) => {
      if (err) {
        console.error("Error sending report:", err);
        return res.status(500).send("Failed to download report");
      }
    });
  });
});

// Start server
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});

