---
slug: pdf-generator
title: Building a PDF Generator with Puppeteer, Express, and Nunjucks
authors: [om]
tags: [javascript]
---

# Building a PDF Generator with Puppeteer, Express, and Nunjucks

In this blog, I’ll walk you through how I built a PDF generator for a Node.js backend service using Puppeteer for PDF rendering, Express for serving HTTP requests, and Nunjucks for HTML templating. The solution is efficient, caching previously generated PDFs to save resources, and it even manages cache cleanup to prevent overloading the system.

<!-- truncate -->

## Why I Chose Puppeteer, Express, and Nunjucks

- **Puppeteer**: A powerful headless browser automation library that allows precise control over rendering HTML into PDFs. Previously I used `wkhtmltopdf` library, however its not maintained, has rudimentary css support, and almost no javascript support. So rendering charts and graphs was not possible with it along with designing complex layouts.
- **Express**: A minimalist and robust web framework for handling HTTP requests seamlessly.
- **Nunjucks**: A flexible templating engine that enables easy generation of dynamic HTML content, especially when working with templates and data.

## The Requirements

The service required the following features:

1. Accept JSON data and render it into a dynamic HTML template.
2. Generate a PDF from the rendered HTML.
3. Cache the generated PDF using an MD5 hash of the input data to avoid regenerating PDFs unnecessarily.
4. Serve cached PDFs when available.
5. Regularly clean up cached files older than 4 hours to manage disk space efficiently.

## Implementation Walkthrough

### Setting Up the Project

Start by initializing a new Node.js project and installing the required dependencies:

```bash
npm init -y
npm install express puppeteer nunjucks crypto fs path
```

### Project Structure

Here’s how I structured the project:

```
project/
├── templates/
│   └── template.html
├── pdfCache/
├── server.js
└── cleanup.js
```

- **templates/template.html**: The Nunjucks HTML template.
- **pdfCache/**: Directory for storing generated PDFs.
- **server.js**: The main Express server handling PDF generation and serving.
- **cleanup.js**: Handles periodic cleanup of old cached PDFs.

### Step 1: Configuring Nunjucks

Set up Nunjucks to render dynamic HTML templates:

```javascript
const nunjucks = require('nunjucks');

nunjucks.configure('templates', {
    autoescape: true,
    express: app, // Integrate with Express
});
```

This points Nunjucks to the `templates` directory and integrates it with Express.

### Step 2: Generating PDFs with Puppeteer

Use Puppeteer to render the HTML template into a PDF:

```javascript
const puppeteer = require('puppeteer');

async function generatePDF(htmlContent, outputPath) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    await page.pdf({ path: outputPath, format: 'A4' });

    await browser.close();
}
```

### Step 3: Caching PDFs

Use an MD5 hash of the input data to uniquely identify and cache PDFs:

```javascript
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const pdfCacheFolder = path.join(__dirname, 'pdfCache');

function getCachePath(data) {
    const hash = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
    return path.join(pdfCacheFolder, `${hash}.pdf`);
}

function isCached(filePath) {
    return fs.existsSync(filePath);
}
```

### Step 4: Building the Express API

Define the Express route to handle PDF generation and serving:

```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.post('/generate-pdf', async (req, res) => {
    const data = req.body;
    const cachePath = getCachePath(data);

    if (isCached(cachePath)) {
        return res.sendFile(cachePath);
    }

    const htmlContent = nunjucks.render('template.html', data);
    await generatePDF(htmlContent, cachePath);

    res.sendFile(cachePath);
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
```

### Step 5: Cleaning Up Old Cached Files

Periodically delete files in the `pdfCache` folder that are older than 4 hours:

```javascript
const cleanupInterval = 60 * 60 * 1000; // Run every hour
const maxAge = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

function cleanupOldFiles() {
    fs.readdir(pdfCacheFolder, (err, files) => {
        if (err) return console.error('Error reading cache folder:', err);

        const now = Date.now();

        files.forEach(file => {
            const filePath = path.join(pdfCacheFolder, file);
            fs.stat(filePath, (err, stats) => {
                if (err) return console.error('Error getting file stats:', err);

                if (now - stats.mtimeMs > maxAge) {
                    fs.unlink(filePath, err => {
                        if (err) console.error('Error deleting file:', err);
                        else console.log(`Deleted old file: ${file}`);
                    });
                }
            });
        });
    });
}

setInterval(cleanupOldFiles, cleanupInterval);
cleanupOldFiles(); // Initial run
```

## Conclusion

This project demonstrates how you can combine Puppeteer, Express, and Nunjucks to build a robust PDF generator. By caching PDFs and periodically cleaning up old files, the service remains efficient and scalable. This architecture can easily be extended to include features like authentication, advanced logging, or distributed tracing.

Feel free to adapt this implementation for your own use cases. Happy coding!


# Building a Robust PDF and Image Generator Using Puppeteer, Nunjucks, and Node.js
## Introduction

Creating and managing PDF generation in a Node.js backend can be a challenging yet rewarding task, especially when you deal with dynamic HTML templates, caching, and performance optimization. In this blog post, I'll walk you through my journey of building a versatile PDF generator using Puppeteer, Nunjucks for templating, and additional utilities like caching, access timestamp updates, and S3 integration. The result is a scalable and robust service capable of generating PDFs and images on demand.
## Key Features

- Dynamic PDF generation using Puppeteer: Convert HTML templates to PDFs with customizable content.
- Template rendering with Nunjucks: Use filters, contexts, and external templates to streamline templating.
- Caching with md5 hashing: Avoid redundant PDF generation by serving cached files.
- Advanced utilities:
  - Cleaning up cached files older than 4 hours.
  - Updating file access timestamps for better cache management.
- Merging multiple PDFs.
- Generating images from HTML content.
- Integration with Express: Seamlessly expose APIs for generating PDFs, images, and health checks.

## Code Highlights
### Project Setup

The service is written in TypeScript for better type safety and clarity. Below are the libraries and tools I used:

- Puppeteer: To control headless Chrome for rendering PDFs and images.
- Nunjucks: A powerful templating engine for HTML generation.
- PDF-lib: For merging multiple PDFs into a single file.
- Express: To create a RESTful backend.
- fs, path: For file handling and managing cached files.
- dotenv: To handle environment variables.

The project structure includes utility functions for caching, templating, and timestamp updates, as well as separate routes for generating PDFs and images.
### API Endpoints
1. Health Check
```javascript
app.get("/healthcheck", (req, res) => {
  res.json({ status: "ok" });
});
```

The /healthcheck endpoint provides a quick way to verify if the service is running.

2. Generate a PDF

The `/generate-pdf` endpoint dynamically creates a PDF based on an HTML template and provided context.

#### Key logic:

- Templates are loaded from a local templates directory or fetched from an S3 bucket if unavailable locally.
- A unique filename is generated using an MD5 hash of the input data.
- If a cached PDF already exists, it serves the file directly after updating its access timestamp.
- Otherwise, a new PDF is generated using Puppeteer.
```javascript
app.post(`${BASE_API_URL}/generate-pdf`, async (req, res) => {
  const context = req.body.context;
  const fileName = md5(req.body);
  const pdfFilePath = path.join(tmpDir, `/${fileName}.pdf`);

  if (fileExists(`${fileName}.pdf`, tmpDir)) {
    await updateAccessTimestamp(pdfFilePath);
    res.sendFile(pdfFilePath);
  } else {
    const compiledTemplate = nunjucks.compile(templateString, env);
    const renderedTemplate = compiledTemplate.render(context);
    await fs.promises.writeFile(htmlFilePath, renderedTemplate);

    await convertHtmlToPdf(htmlFilePath, pdfFilePath);
    res.sendFile(pdfFilePath);
  }
});
```

3. Generate Multiple PDFs and Merge

The `/generate-multipdf` endpoint processes multiple templates and merges their PDFs into a single file. The PDF-lib library is used to copy pages from individual PDFs into one.
```javascript
const mergedPdf = await PDFDocument.create();
for (const htmlFile of htmlFiles) {
  const pdfBytes = await fs.promises.readFile(htmlFile.replace(".html", ".pdf"));
  const pdf = await PDFDocument.load(pdfBytes);
  const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
  copiedPages.forEach((page) => mergedPdf.addPage(page));
}
```

4. Generate an Image

The `/generate-image` endpoint takes an HTML string as input and outputs a JPEG image. Puppeteer is configured to adjust the viewport dynamically based on the content.

```javascript
await page.setViewport({
  width: Math.ceil(width),
  height: Math.ceil(height) + BUFFER,
});
const imageBuffer = await page.screenshot({ type: "jpeg", quality: 100 });
fs.writeFileSync(imgFilePath, imageBuffer);
```

### Key Utilities
1. Caching with Access Timestamps

To avoid redundant file generation, cached files are served when available. Each file's last access timestamp is updated using fs.utimes. Files older than 4 hours are deleted periodically by a scheduled task.

setInterval(deleteOldCachedFiles, 4 * 60 * 60 * 1000); // Run every 4 hours

2. MD5 Hashing

Unique filenames are generated based on the hash of input data to ensure there are no conflicts.

const fileName = md5(req.body);

3. Nunjucks Filters

Custom filters like objDictSort and formatDate were added to Nunjucks to simplify templating.

env.addFilter("objDictSort", objDictSort);
env.addFilter("formatDate", formatDate);

## Challenges and Solutions
1. Caching and Memory Management

    Challenge: Limited memory and disk space for cached files.
    Solution: Implemented an automated cleanup task for files older than 4 hours and updated file access timestamps to keep frequently used files.

2. Dynamic Templates

    Challenge: Fetching templates dynamically from S3 when missing locally.
    Solution: A utility function fetches and compiles templates from S3.

3. Concurrent PDF Generation

    Challenge: Generating and merging multiple PDFs efficiently.
    Solution: Used asynchronous functions and PDF-lib for efficient page merging.

## Results

This service is capable of:

    Generating dynamic, well-structured PDFs.
    Handling multiple templates and merging their PDFs.
    Serving cached files for faster responses.
    Generating high-quality images from HTML.

## Next Steps

    Enhance Monitoring: Add OpenTelemetry for logging and monitoring performance metrics.
    Support Customization: Allow users to define paper sizes, margins, and orientation.
    Improve Scalability: Use distributed caching mechanisms like Redis or a CDN for cached files.

## Conclusion

This project demonstrates how powerful Puppeteer and Nunjucks can be when combined in a Node.js service. With caching, dynamic templates, and PDF/image generation, this service can scale to meet a wide range of business requirements.

Want to build something similar or enhance this project? Reach out to me at om96athalye@gmail.com or explore my Bitbucket repository: OmAthalye.
