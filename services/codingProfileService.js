const fs = require("fs");
const path = require("path");
const os = require("os");
const cheerio = require("cheerio");
const axios = require("axios");
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const { createWorker } = require("tesseract.js");

const User = require("../models/User");
const LeetCodeProfile = require("../models/LeetCodeProfile");
const HackerRankProfile = require("../models/HackerRankProfile");
const Certificate = require("../models/Certificate");
const GitHubProfile = require("../models/GitHubProfile");
const GitHubRepository = require("../models/GitHubRepository");
const AICache = require("../models/AICache");
const aiService = require("./aiService");
const leetCodeService = require("./leetcodeService");
const hackerRankService = require("./hackerRankService");

const PDF_RENDER_TIMEOUT_MS = 30000;
const OCR_TIMEOUT_MS = 60000;
const PDF_RENDER_TARGET_WIDTH = 3200;
const PDF_RENDER_MIN_SCALE = 3;
const PDF_RENDER_MAX_SCALE = 5;
const OCR_PSM = "4";
const OCR_OEM = 1;
const OCR_CONTRAST = 1.35;
const OCR_THRESHOLD_OFFSET = 12;
const OCR_BLUR_RADIUS = 1;

let pdfjsModulePromise = null;

const getPdfjs = () => {
  if (!pdfjsModulePromise) {
    pdfjsModulePromise = import("pdfjs-dist/legacy/build/pdf.mjs");
  }
  return pdfjsModulePromise;
};

const withTimeout = (promise, timeoutMs, message) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const error = new Error(message);
      error.code = "ETIMEDOUT";
      reject(error);
    }, timeoutMs);

    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });

const createOcrResult = (overrides = {}) => ({
  text: "",
  confidence: undefined,
  error: "",
  ...overrides,
});

const isDevelopmentMode = () =>
  (process.env.NODE_ENV || "development") !== "production";

const getOcrDebugDir = () => path.join(os.tmpdir(), "ocr-debug");

const sanitizeDebugName = (value) =>
  String(value || "ocr")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .slice(0, 80);

const clampByte = (value) => Math.max(0, Math.min(255, Math.round(value)));

const computeAverageConfidence = (data) => {
  const confidences = [];
  if (Array.isArray(data?.words)) {
    for (const word of data.words) {
      if (typeof word?.confidence === "number" && Number.isFinite(word.confidence)) {
        confidences.push(word.confidence);
      }
    }
  }

  if (confidences.length > 0) {
    return confidences.reduce((sum, value) => sum + value, 0) / confidences.length;
  }

  if (typeof data?.confidence === "number" && Number.isFinite(data.confidence)) {
    return data.confidence;
  }

  return undefined;
};

const saveDebugArtifacts = async (artifactName, artifacts) => {
  if (!isDevelopmentMode()) return;

  const debugDir = getOcrDebugDir();
  await fs.promises.mkdir(debugDir, { recursive: true });

  const baseName = `${Date.now()}-${sanitizeDebugName(artifactName)}`;
  const tasks = [];

  if (artifacts?.renderedPngBuffer) {
    tasks.push(
      fs.promises.writeFile(
        path.join(debugDir, `${baseName}-rendered.png`),
        artifacts.renderedPngBuffer,
      ),
    );
  }

  if (artifacts?.preprocessedPngBuffer) {
    tasks.push(
      fs.promises.writeFile(
        path.join(debugDir, `${baseName}-preprocessed.png`),
        artifacts.preprocessedPngBuffer,
      ),
    );
  }

  if (artifacts?.ocrText) {
    tasks.push(
      fs.promises.writeFile(
        path.join(debugDir, `${baseName}-ocr.txt`),
        artifacts.ocrText,
        "utf8",
      ),
    );
  }

  if (artifacts?.originalOcrText) {
    tasks.push(
      fs.promises.writeFile(
        path.join(debugDir, `${baseName}-original-ocr.txt`),
        artifacts.originalOcrText,
        "utf8",
      ),
    );
  }

  if (artifacts?.preprocessedOcrText) {
    tasks.push(
      fs.promises.writeFile(
        path.join(debugDir, `${baseName}-preprocessed-ocr.txt`),
        artifacts.preprocessedOcrText,
        "utf8",
      ),
    );
  }

  await Promise.all(tasks);
};

const buildAdaptiveThresholdImage = (sourceImageData) => {
  const { data, width, height } = sourceImageData;
  const pixelCount = width * height;
  const grayscale = new Uint8ClampedArray(pixelCount);

  for (let index = 0, pixel = 0; index < data.length; index += 4, pixel += 1) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const luminance = 0.299 * red + 0.587 * green + 0.114 * blue;
    const contrasted = clampByte((luminance - 128) * OCR_CONTRAST + 128);
    grayscale[pixel] = contrasted;
  }

  const blurred = new Uint8ClampedArray(pixelCount);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let weightedSum = 0;
      let weightTotal = 0;
      for (let ky = -OCR_BLUR_RADIUS; ky <= OCR_BLUR_RADIUS; ky += 1) {
        const sampleY = Math.min(height - 1, Math.max(0, y + ky));
        for (let kx = -OCR_BLUR_RADIUS; kx <= OCR_BLUR_RADIUS; kx += 1) {
          const sampleX = Math.min(width - 1, Math.max(0, x + kx));
          const kernelWeight =
            kx === 0 && ky === 0 ? 4 : Math.abs(kx) + Math.abs(ky) === 1 ? 2 : 1;
          weightedSum += grayscale[sampleY * width + sampleX] * kernelWeight;
          weightTotal += kernelWeight;
        }
      }
      blurred[y * width + x] = Math.round(weightedSum / weightTotal);
    }
  }

  const sharpened = new Uint8ClampedArray(pixelCount);
  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    const value = grayscale[pixel] + (grayscale[pixel] - blurred[pixel]) * 0.7;
    sharpened[pixel] = clampByte(value);
  }

  const integral = new Float64Array((width + 1) * (height + 1));
  for (let y = 1; y <= height; y += 1) {
    let rowSum = 0;
    for (let x = 1; x <= width; x += 1) {
      rowSum += sharpened[(y - 1) * width + (x - 1)];
      integral[y * (width + 1) + x] =
        integral[(y - 1) * (width + 1) + x] + rowSum;
    }
  }

  const thresholdCanvas = createCanvas(width, height);
  const thresholdContext = thresholdCanvas.getContext("2d");
  const outputImageData = thresholdContext.createImageData(width, height);
  const windowRadius = 10;

  for (let y = 0; y < height; y += 1) {
    const top = Math.max(0, y - windowRadius);
    const bottom = Math.min(height - 1, y + windowRadius);
    for (let x = 0; x < width; x += 1) {
      const left = Math.max(0, x - windowRadius);
      const right = Math.min(width - 1, x + windowRadius);
      const count = (right - left + 1) * (bottom - top + 1);
      const sum =
        integral[(bottom + 1) * (width + 1) + (right + 1)] -
        integral[top * (width + 1) + (right + 1)] -
        integral[(bottom + 1) * (width + 1) + left] +
        integral[top * (width + 1) + left];
      const mean = sum / count;
      const threshold = mean - OCR_THRESHOLD_OFFSET;
      const sourceValue = sharpened[y * width + x];
      const outputValue = sourceValue > threshold ? 255 : 0;
      const outputIndex = (y * width + x) * 4;
      outputImageData.data[outputIndex] = outputValue;
      outputImageData.data[outputIndex + 1] = outputValue;
      outputImageData.data[outputIndex + 2] = outputValue;
      outputImageData.data[outputIndex + 3] = 255;
    }
  }

  thresholdContext.putImageData(outputImageData, 0, 0);

  return thresholdCanvas;
};

const preprocessOcrImage = async (pngBuffer) => {
  const image = await loadImage(pngBuffer);
  const canvas = createCanvas(image.width, image.height);
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0);
  const sourceImageData = context.getImageData(0, 0, image.width, image.height);
  const thresholdCanvas = buildAdaptiveThresholdImage(sourceImageData);
  return {
    buffer: thresholdCanvas.toBuffer("image/png"),
    width: thresholdCanvas.width,
    height: thresholdCanvas.height,
  };
};

const mapPdfRenderError = (error) => {
  const message = error?.message || "";
  const name = error?.name || "";

  if (/password|encrypted/i.test(`${name} ${message}`)) {
    return "PDF is encrypted or password protected and cannot be rendered for OCR.";
  }
  if (/Invalid PDF|bad XRef|FormatError|corrupt|Unexpected server response/i.test(message)) {
    return "PDF is corrupted or unreadable and could not be rendered for OCR.";
  }
  if (error?.code === "ETIMEDOUT") {
    return message || "PDF first-page rendering timed out.";
  }
  return message || "PDF first-page rendering failed.";
};

const renderFirstPdfPageToPng = async (pdfPath) => {
  const startedAt = Date.now();
  let loadingTask = null;

  console.log("========== PDF RENDER START ==========");
  console.log("Renderer used: pdfjs-dist + @napi-rs/canvas");

  try {
    const pdfjs = await getPdfjs();
    const fileBuffer = await fs.promises.readFile(pdfPath);
    const pdfData = Uint8Array.from(fileBuffer);

    loadingTask = pdfjs.getDocument({
      data: pdfData,
      disableWorker: true,
      useSystemFonts: true,
    });

    const pdfDocument = await withTimeout(
      loadingTask.promise,
      PDF_RENDER_TIMEOUT_MS,
      "PDF document loading timed out.",
    );
    const page = await withTimeout(
      pdfDocument.getPage(1),
      PDF_RENDER_TIMEOUT_MS,
      "PDF first-page loading timed out.",
    );

    const baseViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(
      PDF_RENDER_MAX_SCALE,
      Math.max(PDF_RENDER_MIN_SCALE, PDF_RENDER_TARGET_WIDTH / baseViewport.width),
    );
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(
      Math.ceil(viewport.width),
      Math.ceil(viewport.height),
    );
    const canvasContext = canvas.getContext("2d");

    await withTimeout(
      page.render({ canvasContext, viewport }).promise,
      PDF_RENDER_TIMEOUT_MS,
      "PDF first-page rendering timed out.",
    );

    const pngBuffer = canvas.toBuffer("image/png");
    await pdfDocument.cleanup?.();

    console.log(`Rendering time: ${Date.now() - startedAt}ms`);
    console.log(`Image size: ${canvas.width}x${canvas.height}`);
    console.log(`PNG size: ${pngBuffer.length} bytes`);
    console.log("========== PDF RENDER END ==========");

    return {
      pngBuffer,
      width: canvas.width,
      height: canvas.height,
      pngSize: pngBuffer.length,
    };
  } catch (error) {
    console.error("PDF render error:", error.message);
    console.log(`Rendering time: ${Date.now() - startedAt}ms`);
    console.log("Image size: 0x0");
    console.log("PNG size: 0 bytes");
    console.log("========== PDF RENDER END ==========");
    throw new Error(mapPdfRenderError(error));
  } finally {
    if (loadingTask) {
      await loadingTask.destroy().catch(() => {});
    }
  }
};

const runOcrOnPdf = async (pdfPath) => {
  let worker = null;
  try {
    const renderedPage = await renderFirstPdfPageToPng(pdfPath);
    if (!renderedPage.pngBuffer || renderedPage.pngBuffer.length === 0) {
      return createOcrResult({
        error: "PDF first page rendered no OCR image data.",
      });
    }

    worker = await withTimeout(
      createWorker("eng", OCR_OEM),
      OCR_TIMEOUT_MS,
      "Tesseract OCR worker initialization timed out.",
    );
    await withTimeout(
      worker.setParameters({
        tessedit_pageseg_mode: OCR_PSM,
        preserve_interword_spaces: "1",
        user_defined_dpi: "600",
      }),
      OCR_TIMEOUT_MS,
      "Tesseract OCR parameter configuration timed out.",
    );

    const runOcrPass = async (imageBuffer, passLabel) => {
      const passStartedAt = Date.now();
      const { data } = await withTimeout(
        worker.recognize(imageBuffer),
        OCR_TIMEOUT_MS,
        `Tesseract OCR recognition timed out (${passLabel}).`,
      );
      const text = data?.text || "";
      const confidence = computeAverageConfidence(data);
      return {
        passLabel,
        text,
        confidence,
        durationMs: Date.now() - passStartedAt,
      };
    };

    const originalPass = await runOcrPass(
      renderedPage.pngBuffer,
      "original-render",
    );

    let preprocessedPage = null;
    try {
      preprocessedPage = await preprocessOcrImage(renderedPage.pngBuffer);
    } catch (preprocessError) {
      console.error("OCR preprocessing error:", preprocessError.message);
    }

    const preprocessedPass = preprocessedPage
      ? await runOcrPass(preprocessedPage.buffer, "preprocessed")
      : createOcrResult({
          text: "",
          confidence: undefined,
          passLabel: "preprocessed",
          error: "OCR preprocessing failed.",
        });

    const originalConfidence =
      typeof originalPass.confidence === "number" ? originalPass.confidence : -1;
    const preprocessedConfidence =
      typeof preprocessedPass.confidence === "number"
        ? preprocessedPass.confidence
        : -1;
    const selectedPass =
      preprocessedConfidence > originalConfidence
        ? { ...preprocessedPass, source: "preprocessed" }
        : { ...originalPass, source: "original" };

    if (typeof selectedPass.confidence === "number" && selectedPass.confidence < 70) {
      console.warn(`Low OCR confidence warning: ${selectedPass.confidence.toFixed(2)}`);
    }

    await saveDebugArtifacts(path.basename(pdfPath, path.extname(pdfPath)), {
      renderedPngBuffer: renderedPage.pngBuffer,
      preprocessedPngBuffer: preprocessedPage?.buffer,
      originalOcrText: originalPass.text || "",
      preprocessedOcrText: preprocessedPass.text || "",
      ocrText: selectedPass.text || "",
    });

    return createOcrResult({
      text: selectedPass.text || "",
      confidence:
        typeof selectedPass.confidence === "number"
          ? selectedPass.confidence
          : undefined,
      originalText: originalPass.text || "",
      originalConfidence:
        typeof originalPass.confidence === "number"
          ? originalPass.confidence
          : undefined,
      preprocessedText: preprocessedPass.text || "",
      preprocessedConfidence:
        typeof preprocessedPass.confidence === "number"
          ? preprocessedPass.confidence
          : undefined,
      selectedPass: selectedPass.source || "original",
      renderedWidth: renderedPage.width,
      renderedHeight: renderedPage.height,
      preprocessedWidth: preprocessedPage?.width || renderedPage.width,
      preprocessedHeight: preprocessedPage?.height || renderedPage.height,
    });
  } catch (error) {
    console.error("runOcrOnPdf error:", error.message);
    return createOcrResult({
      error: error.message || "OCR failed while processing the PDF.",
    });
  } finally {
    if (worker) {
      await worker.terminate().catch(() => {});
    }
  }
};

const extractTextFromPdf = async (pdfPath) => {
  const result = await runOcrOnPdf(pdfPath);

  console.log("========== ORIGINAL OCR ==========");
  console.log(result.originalText || "");
  console.log("==================================");
  console.log("========== PREPROCESSED OCR =======");
  console.log(result.preprocessedText || "");
  console.log("==================================");
  console.log(
    `OCR confidence: original=${typeof result.originalConfidence === "number" ? result.originalConfidence.toFixed(2) : "n/a"}, preprocessed=${typeof result.preprocessedConfidence === "number" ? result.preprocessedConfidence.toFixed(2) : "n/a"}, selected=${typeof result.confidence === "number" ? result.confidence.toFixed(2) : "n/a"}`,
  );

  if (result.error) {
    console.error("OCR extraction error:", result.error);
  }

  return {
    text: result.text || "",
    ocrUsed: true,
    ocrConfidence: result.confidence,
    originalText: result.originalText || "",
    originalConfidence: result.originalConfidence,
    preprocessedText: result.preprocessedText || "",
    preprocessedConfidence: result.preprocessedConfidence,
    selectedPass: result.selectedPass || "original",
    renderedWidth: result.renderedWidth,
    renderedHeight: result.renderedHeight,
    preprocessedWidth: result.preprocessedWidth,
    preprocessedHeight: result.preprocessedHeight,
    extractionError: result.error || "",
  };
};

const normalizeExtractedText = (text) => {
  if (!text) return "";
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u00A0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const HACKERRANK_CERTIFICATE_URL_RE =
  /^\/certificates\/(?:iframe\/)?([a-zA-Z0-9_-]+)\/?$/i;
const HACKERRANK_HOSTS = new Set(["hackerrank.com", "www.hackerrank.com"]);

const parseHackerRankCertificateUrl = (rawUrl) => {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(String(rawUrl).trim());
    if (parsed.protocol !== "https:") return null;
    const host = parsed.hostname.toLowerCase();
    if (!HACKERRANK_HOSTS.has(host)) return null;
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host === "0.0.0.0"
    ) {
      return null;
    }

    const pathMatch = parsed.pathname.match(HACKERRANK_CERTIFICATE_URL_RE);
    if (!pathMatch) return null;

    return {
      certificateId: pathMatch[1],
      canonicalUrl: `https://www.hackerrank.com/certificates/${pathMatch[1]}`,
      isIframe: /\/certificates\/iframe\//i.test(parsed.pathname),
    };
  } catch (error) {
    return null;
  }
};

const normalizeHackerRankVerificationUrl = (rawUrl) => {
  const parsed = parseHackerRankCertificateUrl(rawUrl);
  return parsed ? parsed.canonicalUrl : "";
};

const isAllowedHackerRankUrl = (url) => !!parseHackerRankCertificateUrl(url);

const parseIssueDate = (value) => {
  if (!value) return null;
  const cleaned = String(value).replace(/\s+/g, " ").trim();
  const patterns = [
    /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*,?\s+\d{4})\b/i,
    /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/i,
    /\b(\d{4}-\d{2}-\d{2})\b/,
    /\b(\d{4}[\/.]\d{1,2}[\/.]\d{1,2})\b/,
    /\b(\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4})\b/,
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (!match) continue;
    const normalized = match[1].replace(/[,]/g, " ").replace(/\s+/g, " ").trim();
    const parsedDate = new Date(normalized);
    if (!Number.isNaN(parsedDate.getTime())) return parsedDate;
  }

  const parsedDate = new Date(cleaned.replace(/[,]/g, " "));
  if (!Number.isNaN(parsedDate.getTime())) return parsedDate;
  return null;
};

const cleanOcrNameLine = (line) => {
  const cleaned = String(line || "")
    .replace(/[^A-Za-z\s'.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = cleaned.split(" ").filter(Boolean);
  while (words.length > 2 && words[words.length - 1].length <= 1) {
    words.pop();
  }
  return words.join(" ");
};

const normalizeCertificateText = (value) =>
  String(value || "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .trim();

const certificateNoisePatterns = [
  /the bearer/i,
  /certificate of accomplishment/i,
  /earned on/i,
  /hackerrank/i,
];

const isSuspiciousCertificateName = (value) => {
  const normalized = normalizeCertificateText(value);
  if (!normalized) return true;
  if (normalized.length > 100) return true;
  return certificateNoisePatterns.some((pattern) => pattern.test(normalized));
};

const isSuspiciousCandidateName = (value) => {
  const normalized = cleanOcrNameLine(value);
  if (!normalized) return true;
  if (normalized.length > 60) return true;
  if (/the bearer|certificate of accomplishment|earned on|hackerrank/i.test(normalized)) {
    return true;
  }
  return false;
};

const extractLabelValue = (text, labelPatterns) => {
  const lines = normalizeExtractedText(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    for (const labelPattern of labelPatterns) {
      if (!labelPattern.test(line)) continue;
      const directMatch = line.match(/[:\-]\s*(.+)$/);
      if (directMatch && directMatch[1].trim()) {
        return directMatch[1].trim();
      }
      const nextLine = lines[index + 1];
      if (nextLine) return nextLine.trim();
    }
  }

  return "";
};

const extractCandidateName = (text) => {
  const lines = normalizeExtractedText(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const markerIndex = lines.findIndex((line) => /presented\s*to/i.test(line));
  if (markerIndex >= 0) {
    for (let index = markerIndex + 1; index < lines.length; index += 1) {
      const candidateLine = cleanOcrNameLine(lines[index]).replace(/\s+\d+$/, "").trim();
      if (isSuspiciousCandidateName(candidateLine)) continue;
      return candidateLine;
    }
  }

  const fallbackPatterns = [
    /(?:Candidate\s*Name|Name\s*of\s*Candidate|Recipient|Awarded\s+to|Issued\s+to)[:\s]+([A-Za-z0-9][A-Za-z0-9\s\.\-']{1,80})/i,
    /This\s+is\s+to\s+certify\s+that[\s\r\n]+([A-Za-z0-9][A-Za-z0-9\s\.\-']{1,80}?)(?:[\s\r\n]+(?:has|successfully|cleared|for|completed)|$)/i,
  ];

  for (const pattern of fallbackPatterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const candidate = cleanOcrNameLine(match[1]).replace(/\s+\d+$/, "").trim();
    if (!isSuspiciousCandidateName(candidate)) {
      return candidate;
    }
  }

  for (const line of lines) {
    const candidate = cleanOcrNameLine(line).replace(/\s+\d+$/, "").trim();
    if (isSuspiciousCandidateName(candidate)) continue;
    if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z'.-]+){0,4}$/.test(candidate)) {
      return candidate;
    }
  }

  return "";
};

const knownCertificateTitles = [
  "SQL",
  "Python",
  "JavaScript",
  "Java",
  "React",
  "Node.js",
  "Problem Solving",
  "Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Rest API",
  "C",
  "C++",
  "Ruby",
  "Go",
  "Angular",
  "Spring Boot",
  "Artificial Intelligence",
  "Machine Learning",
  "Data Structures",
  "Algorithms",
];

const extractCertificateName = (text) => {
  const lines = normalizeExtractedText(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const normalizedLine = normalizeCertificateText(line);
    if (!normalizedLine || certificateNoisePatterns.some((pattern) => pattern.test(normalizedLine))) {
      continue;
    }

    for (const title of knownCertificateTitles) {
      const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const difficultyPattern = new RegExp(`\\b(${escaped})\\s*\\((Basic|Intermediate|Advanced|Expert)\\)\\b`, "i");
      const plainPattern = new RegExp(`\\b(${escaped})\\b`, "i");
      const difficultyMatch = normalizedLine.match(difficultyPattern);
      if (difficultyMatch) {
        const certificateName = normalizeCertificateText(`${difficultyMatch[1]} (${difficultyMatch[2]})`);
        if (!isSuspiciousCertificateName(certificateName)) {
          return certificateName;
        }
      }
      const plainMatch = normalizedLine.match(plainPattern);
      if (plainMatch) {
        const certificateName = normalizeCertificateText(plainMatch[1]);
        if (!isSuspiciousCertificateName(certificateName)) {
          return certificateName;
        }
      }
    }
  }

  const embeddedTitleMatch = text.match(
    /\b((?:SQL|Python|JavaScript|Java|React|Node\.js|Problem\s+Solving|Software\s+Engineer|Frontend\s+Developer|Backend\s+Developer|Rest\s+API|C\+\+|C|Ruby|Go|Angular|Spring\s+Boot|Artificial\s+Intelligence|Machine\s+Learning|Data\s+Structures|Algorithms)(?:\s*\((?:Basic|Intermediate|Advanced|Expert)\))?)\b/i,
  );
  if (embeddedTitleMatch) {
    const certificateName = normalizeCertificateText(embeddedTitleMatch[1]);
    if (!isSuspiciousCertificateName(certificateName)) {
      return certificateName;
    }
  }

  return "";
};

const extractDifficulty = (certificateName, text) => {
  const titleDifficultyMatch = String(certificateName || "").match(
    /\((Basic|Intermediate|Advanced|Expert)\)/i,
  );
  if (titleDifficultyMatch) return titleDifficultyMatch[1];

  const textDifficultyMatch = normalizeExtractedText(text).match(
    /\b(Basic|Intermediate|Advanced|Expert)\b/i,
  );
  return textDifficultyMatch ? textDifficultyMatch[1] : "";
};

const extractSkillFromCertificateName = (certificateName) => {
  if (!certificateName) return "";
  return normalizeCertificateText(certificateName)
    .replace(/\((Basic|Intermediate|Advanced|Expert)\)/i, "")
    .trim();
};

const parseCertificateTextMetadata = (rawText, originalName = "") => {
  const text = normalizeExtractedText(rawText);
  const compactText = text.replace(/\s+/g, " ");

  const metadata = {
    candidateName: "",
    certificateName: "",
    certificateId: "",
    issueDate: null,
    verificationUrl: "",
    skill: "",
    difficulty: "",
    language: "",
    name: "",
    ocrConfidence: undefined,
    extractionError: "",
  };

  const urlMatch =
    text.match(
      /https?:\/\/(?:www\.)?hackerrank\.com\/certificates\/(?:iframe\/)?[a-zA-Z0-9_-]+/i,
    ) ||
    compactText.replace(/\s+/g, "").match(
      /https?:\/\/(?:www\.)?hackerrank\.com\/certificates\/(?:iframe\/)?[a-zA-Z0-9_-]+/i,
    );

  if (urlMatch) {
    metadata.verificationUrl = normalizeHackerRankVerificationUrl(urlMatch[0]);
    metadata.certificateId = metadata.verificationUrl.split("/").pop().trim();
  }

  if (!metadata.certificateId) {
    const idPatterns = [
      /(?:Certificate\s*ID|Credential\s*ID|Cert(?:ificate)?\s*(?:ID|#)|ID)[:\s]*([A-Za-z0-9_-]{6,})\b/i,
    ];
    for (const pattern of idPatterns) {
      const match = text.match(pattern);
      if (match) {
        metadata.certificateId = match[1].trim();
        break;
      }
    }
  }

  metadata.candidateName = extractCandidateName(text);
  metadata.certificateName = extractCertificateName(text);
  metadata.issueDate =
    parseIssueDate(
      extractLabelValue(text, [
        /(?:Issue\s*Date|Issued\s*(?:On|:)?|Date\s*of\s*Issue|Completed\s*(?:On|:)?|Awarded\s*(?:On|:)?|Earned\s*on)/i,
      ]) || "",
    ) || null;

  if (!metadata.issueDate) {
    const dateFallbacks = [
      /(?:Issue\s*Date|Issued\s*(?:On|:)?|Date\s*of\s*Issue|Completed\s*(?:On|:)?|Awarded\s*(?:On|:)?|Earned\s*on)[:\s\r\n]+([^\n]+)/i,
      /(\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*,?\s+\d{4}\b)/i,
      /(\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b)/i,
      /(\b\d{4}-\d{2}-\d{2}\b)/,
    ];
    for (const pattern of dateFallbacks) {
      const match = text.match(pattern);
      if (!match) continue;
      const parsedDate = parseIssueDate(match[1]);
      if (parsedDate) {
        metadata.issueDate = parsedDate;
        break;
      }
    }
  }

  metadata.difficulty = extractDifficulty(metadata.certificateName, text);

  const languageMatch = text.match(
    /\b(JavaScript|TypeScript|Python|Java|C#|C\+\+|Ruby|Go|PHP|Swift|Kotlin|Rust|Scala)\b/i,
  );
  if (languageMatch) metadata.language = languageMatch[1];

  metadata.skill = extractSkillFromCertificateName(metadata.certificateName);
  if (!metadata.skill) {
    const skillLabelValue = extractLabelValue(text, [/^(?:Skill|Skills)\b/i]);
    if (skillLabelValue) {
      const cleanedSkill = normalizeCertificateText(skillLabelValue).trim();
      if (
        cleanedSkill &&
        !certificateNoisePatterns.some((pattern) => pattern.test(cleanedSkill))
      ) {
        metadata.skill = cleanedSkill.replace(/\((Basic|Intermediate|Advanced|Expert)\)/i, "").trim();
      }
    }
  }

  metadata.name =
    metadata.certificateName ||
    metadata.skill ||
    originalName.replace(path.extname(originalName), "").replace(/[-_]/g, " ").trim();

  return metadata;
};

const extractCertificateData = async (filePath, originalName = "") => {
  const {
    text,
    ocrUsed,
    ocrConfidence,
    extractionError,
  } = await extractTextFromPdf(filePath);
  const metadata = parseCertificateTextMetadata(text || "", originalName);

  metadata.ocrConfidence = ocrConfidence;
  metadata.extractionError = extractionError;

  console.log("========== OCR TEXT ==========");
  console.log(text || "");
  console.log("==============================");
  console.log("========== EXTRACTED METADATA ==========");
  console.log("Candidate Name:", metadata.candidateName || "");
  console.log("Certificate Name:", metadata.certificateName || "");
  console.log("Issue Date:", metadata.issueDate || "");
  console.log("Certificate ID:", metadata.certificateId || "");
  console.log("Skill:", metadata.skill || "");
  console.log("Difficulty:", metadata.difficulty || "");
  console.log("Verification URL:", metadata.verificationUrl || "");

  return {
    ...metadata,
    rawExtractedText: text || "",
    ocrUsed,
    ocrConfidence,
    extractionError,
  };
};

const detectCertificateFormat = (metadata) => {
  if (metadata.verificationUrl) return "Old";
  if (metadata.certificateId) return "New";
  return "Unknown";
};

const metadataExtractionSucceeded = (metadata) =>
  !!(
    metadata.candidateName ||
    metadata.certificateName ||
    metadata.certificateId ||
    metadata.issueDate
  );

const extractCertificateMetadata = async (filePath, originalName) => {
  const data = await extractCertificateData(filePath, originalName);
  return {
    name: data.name,
    issueDate: data.issueDate,
    language: data.language,
    skill: data.skill,
    difficulty: data.difficulty,
    candidateName: data.candidateName,
    certificateName: data.certificateName,
    certificateId: data.certificateId,
    verificationUrl: data.verificationUrl,
    rawExtractedText: data.rawExtractedText,
    ocrUsed: data.ocrUsed,
    ocrConfidence: data.ocrConfidence,
    extractionError: data.extractionError,
  };
};

const saveUserCodingStatus = async (
  user,
  profileType,
  username,
  profileUrl,
) => {
  if (profileType === "leetcode") {
    user.leetCodeConnected = true;
    user.leetCodeUsername = username;
    user.leetCodeProfileUrl = profileUrl;
  }
  if (profileType === "hackerrank") {
    user.hackerRankConnected = true;
    user.hackerRankUsername = username;
    user.hackerRankProfileUrl = profileUrl;
  }
  await user.save();
};

exports.connectLeetCode = async (user, body, options = {}) => {
  const username = body.username
    ? leetCodeService.normalizeUsername(body.username)
    : leetCodeService.normalizeUsername(body.profileUrl);
  if (!username) {
    const error = new Error(
      "Valid LeetCode username or profile URL is required",
    );
    error.status = 400;
    throw error;
  }

  const profileData = await leetCodeService.fetchLeetCodeProfile(username);
  const profileUrl = profileData.profileUrl;

  const profile = await LeetCodeProfile.findOneAndUpdate(
    { userId: user._id },
    {
      userId: user._id,
      ...buildLeetCodeProfileFields(profileData, new Date()),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  await saveUserCodingStatus(
    user,
    "leetcode",
    profile.username,
    profile.profileUrl,
  );

  profile.aiAnalysis = await aiService.analyzeLeetCodeProfile(
    profile,
    user._id,
    {
      forceRegenerate: !!options.forceRegenerate,
      cacheOnly: !options.forceRegenerate,
    },
  );
  await profile.save();

  return profile;
};

exports.getLeetCodeProfile = async (userId) => {
  return LeetCodeProfile.findOne({ userId });
};

const deleteAiCaches = async (userId, featureNames) => {
  await AICache.deleteMany({
    userId,
    featureName: { $in: featureNames },
  });
};

const isRecentlySynced = (profile) => {
  if (!profile?.lastSynced) return false;
  return Date.now() - new Date(profile.lastSynced).getTime() < 24 * 60 * 60 * 1000;
};

const buildLeetCodeProfileFields = (profileData, lastSynced = new Date()) => ({
  username: profileData.username,
  displayName: profileData.displayName,
  profileUrl: profileData.profileUrl,
  about: profileData.about,
  countryName: profileData.countryName,
  ranking: profileData.ranking,
  reputation: profileData.reputation,
  totalSolved: profileData.totalSolved,
  easySolved: profileData.easySolved,
  mediumSolved: profileData.mediumSolved,
  hardSolved: profileData.hardSolved,
  acceptanceRate: profileData.acceptanceRate,
  successPercentage: profileData.successPercentage,
  totalSubmissions: profileData.totalSubmissions,
  acceptedSubmissions: profileData.acceptedSubmissions,
  currentStreak: profileData.currentStreak,
  submissionCalendar: profileData.submissionCalendar,
  programmingLanguages: profileData.programmingLanguages,
  knownTopics: profileData.knownTopics,
  recentSubmissions: profileData.recentSubmissions,
  recentProblems: profileData.recentProblems,
  contestRating: profileData.contestRating,
  bestRating: profileData.bestRating,
  globalRank: profileData.globalRank,
  totalContests: profileData.totalContests,
  badges: profileData.badges,
  skills: profileData.skills,
  contestHistory: profileData.contestHistory,
  avatar: profileData.avatar,
  lastSynced,
});

exports.syncLeetCode = async (user, options = {}) => {
  const userId = user.id || user._id;
  const existing = await LeetCodeProfile.findOne({ userId });
  if (!existing) {
    const error = new Error("No LeetCode profile connected.");
    error.status = 404;
    throw error;
  }

  if (!options.forceSync && isRecentlySynced(existing)) {
    return existing;
  }

  const username =
    leetCodeService.normalizeUsername(existing.username) ||
    leetCodeService.normalizeUsername(existing.profileUrl);
  if (!username) {
    const error = new Error(
      "Connected LeetCode profile is missing a valid username",
    );
    error.status = 400;
    throw error;
  }

  const profileData = await leetCodeService.fetchLeetCodeProfile(username);
  existing.set(buildLeetCodeProfileFields(profileData, new Date()));

  await saveUserCodingStatus(
    user,
    "leetcode",
    existing.username,
    existing.profileUrl,
  );
  existing.aiAnalysis = await aiService.analyzeLeetCodeProfile(
    existing,
    userId,
    {
      forceRegenerate: !!options.forceRegenerate,
      cacheOnly: !options.forceRegenerate,
    },
  );
  await existing.save();

  return existing;
};

exports.disconnectLeetCode = async (user) => {
  const userId = user.id || user._id;
  const profile = await LeetCodeProfile.findOne({ userId });
  if (!profile) {
    const error = new Error("No LeetCode profile connected.");
    error.status = 404;
    throw error;
  }

  await LeetCodeProfile.deleteOne({ _id: profile._id });
  await deleteAiCaches(userId, ["leetcode-analysis", "candidate-coding-summary"]);

  user.leetCodeConnected = false;
  user.leetCodeUsername = "";
  user.leetCodeProfileUrl = "";
  await user.save();
};

exports.connectHackerRank = async (user, body, options = {}) => {
  const username = body.username
    ? hackerRankService.normalizeUsername(body.username)
    : hackerRankService.normalizeUsername(body.profileUrl);
  if (!username) {
    const error = new Error(
      "Valid HackerRank username or profile URL is required",
    );
    error.status = 400;
    throw error;
  }

  const profileData = await hackerRankService.fetchHackerRankProfile(username);
  const profileUrl = profileData.profileUrl;

  const profile = await HackerRankProfile.findOneAndUpdate(
    { userId: user._id },
    {
      userId: user._id,
      username: profileData.username,
      profileUrl,
      skills: profileData.skills,
      verified: profileData.verified,
      connected: true,
      lastSynced: new Date(),
      aiAnalysis: {
        profileSummary: profileData.verified
          ? "Verified HackerRank profile connected"
          : "Profile connected, verification pending",
      },
    },
    { upsert: true, new: true },
  );

  await saveUserCodingStatus(
    user,
    "hackerrank",
    profile.username,
    profile.profileUrl,
  );
  return profile;
};

exports.getHackerRankProfile = async (userId) => {
  return HackerRankProfile.findOne({ userId });
};

exports.syncHackerRank = async (user, options = {}) => {
  const userId = user.id || user._id;
  const existing = await HackerRankProfile.findOne({ userId });
  const username =
    hackerRankService.normalizeUsername(existing?.username) ||
    hackerRankService.normalizeUsername(existing?.profileUrl);
  if (!username) {
    const error = new Error(
      "Connect a HackerRank profile before syncing",
    );
    error.status = 400;
    throw error;
  }

  const profileData = await hackerRankService.fetchHackerRankProfile(username);
  
  const certificates = await Certificate.find({ userId, verified: true });
  const knownSkills = [];
  const skillCategories = {};
  
  certificates.forEach(cert => {
    if (cert.skill) {
       if (!knownSkills.includes(cert.skill)) {
         knownSkills.push(cert.skill);
       }
       let category = "General";
       if (/(React|Angular|Frontend|CSS|HTML|UI)/i.test(cert.skill)) category = "Frontend";
       else if (/(Node|Backend|Spring|Express|Rest API|Django)/i.test(cert.skill)) category = "Backend";
       else if (/(SQL|Database|MongoDB|Postgres)/i.test(cert.skill)) category = "Database";
       else if (/(Problem Solving|Data Structures|Algorithms)/i.test(cert.skill)) category = "Algorithms";
       else if (/(Python|Java|C\+\+|C|JavaScript|Ruby|Go)/i.test(cert.skill)) category = "Languages";
       
       if (!skillCategories[category]) skillCategories[category] = [];
       if (!skillCategories[category].includes(cert.skill)) {
         skillCategories[category].push(cert.skill);
       }
    }
  });

  const categoriesArray = Object.keys(skillCategories).map(cat => ({
     category: cat,
     skills: skillCategories[cat]
  }));

  existing.username = profileData.username;
  existing.profileUrl = profileData.profileUrl;
  existing.skills = profileData.skills || knownSkills;
  existing.knownSkills = knownSkills;
  existing.skillCategories = categoriesArray;
  existing.verified = profileData.verified;
  existing.connected = true;
  existing.lastSynced = new Date();
  existing.aiAnalysis = {
    profileSummary: profileData.verified
      ? "Verified HackerRank profile synced"
      : "Profile synced, verification pending",
  };

  await existing.save();

  await saveUserCodingStatus(
    user,
    "hackerrank",
    existing.username,
    existing.profileUrl,
  );
  return existing;
};

exports.disconnectHackerRank = async (user) => {
  const userId = user.id || user._id;
  const profile = await HackerRankProfile.findOne({ userId });
  if (!profile) {
    const error = new Error("No HackerRank profile connected.");
    error.status = 404;
    throw error;
  }

  await HackerRankProfile.deleteOne({ _id: profile._id });
  await deleteAiCaches(userId, [
    "hackerrank-profile-analysis",
    "candidate-coding-summary",
  ]);

  user.hackerRankConnected = false;
  user.hackerRankUsername = "";
  user.hackerRankProfileUrl = "";
  await user.save();
};

const normalizeString = (str) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const datesMatch = (date1, date2) => {
  if (!date1 || !date2) return false;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
  return Math.abs(d1.getTime() - d2.getTime()) <= 24 * 60 * 60 * 1000;
};


const mapVerificationNetworkError = (error) => {
  const status = error.response?.status;
  if (status === 401) {
    return "Authentication is required to access the HackerRank certificate page.";
  }
  if (status === 403) {
    return "Access denied while fetching the official HackerRank verification page.";
  }
  if (status === 404) {
    return "Certificate not found on the official HackerRank verification page.";
  }
  if (status === 429) {
    return "Rate limited by HackerRank while fetching the verification page.";
  }
  if (status >= 500) {
    return "HackerRank server error while fetching the verification page.";
  }
  if (error.code === "ECONNABORTED") {
    return "Verification request timed out after 15 seconds.";
  }
  if (error.code === "ECONNREFUSED") {
    return "Connection refused while contacting HackerRank.";
  }
  return `Verification failed: network error (${error.message})`;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const buildHackerRankRedirectUrl = (options = {}) => {
  try {
    return new URL(
      `${options.protocol || "https:"}//${options.hostname || ""}${options.path || "/"}`,
    ).toString();
  } catch (error) {
    return "";
  }
};

const fetchOfficialHackerRankPage = async (targetUrl) => {
  let lastError = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await axios.get(targetUrl, {
        timeout: 15000,
        maxRedirects: 5,
        beforeRedirect: (options) => {
          const redirectUrl = buildHackerRankRedirectUrl(options);
          if (!isAllowedHackerRankUrl(redirectUrl)) {
            const redirectError = new Error(
              "Redirect blocked: verification URL resolved outside hackerrank.com",
            );
            redirectError.code = "ERR_HACKERRANK_REDIRECT_BLOCKED";
            throw redirectError;
          }
        },
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        validateStatus: (status) => status >= 200 && status < 500,
      });

      const finalUrl =
        response.request?.res?.responseUrl ||
        response.request?.responseURL ||
        targetUrl;

      if (!isAllowedHackerRankUrl(finalUrl)) {
        throw new Error(
          "Redirect blocked: verification URL resolved outside hackerrank.com",
        );
      }

      if (response.status >= 400) {
        const err = new Error(`HTTP ${response.status}`);
        err.response = response;
        throw err;
      }

      return response.data;
    } catch (error) {
      lastError = error;
      if (attempt < 2) {
        await sleep(1000 * (attempt + 1));
      }
    }
  }

  throw lastError;
};

const parseOfficialPageMetadata = (html, certId) => {
  const officialMeta = {
    candidateName: "",
    certificateName: "",
    certificateId: certId,
    issueDate: null,
    skill: "",
    difficulty: "",
    description: "",
  };

  const $ = cheerio.load(html);

  const pageLabel = $("h1.page-label").first().text().trim();
  const descriptionHeading = $(".certificate-description-heading").first().text().trim();
  const headingText = pageLabel || descriptionHeading || $("h2.certificate_v3-heading").text().trim();
  if (headingText) {
    officialMeta.certificateName = headingText
      .replace(/^Certificate:\s*/i, "")
      .replace(/\s*Certificate$/i, "")
      .trim();
  }

  const candidateHeading = $(".passed-certificates-heading").first().text().trim();
  const candidateMatch = candidateHeading.match(/^([^'\n]+)'s\s+HackerRank\s+Certificates/i);
  if (candidateMatch) {
    officialMeta.candidateName = candidateMatch[1].trim();
  } else {
    $("h1, h2, h3, h4, div").each((i, el) => {
      const txt = $(el).text().trim();
      const match = txt.match(/^([^'\n]+)'s\s+HackerRank\s+Certificates/i);
      if (match) {
        officialMeta.candidateName = match[1].trim();
        return false;
      }
      return undefined;
    });
  }

  const skillLink = $(".passed-certificates-list .certificate-link").first();
  const skillSlug = skillLink.attr("data-cd-skill-name") || skillLink.attr("data-attr1") || "";
  if (skillSlug) {
    const slugParts = skillSlug.split(/[_-]+/).filter(Boolean);
    const slugDifficulty = slugParts[slugParts.length - 1];
    const difficultyToken = /^(basic|intermediate|advanced|expert)$/i.test(slugDifficulty)
      ? slugDifficulty
      : "";
    const skillParts = difficultyToken ? slugParts.slice(0, -1) : slugParts;
    if (difficultyToken && !officialMeta.difficulty) {
      officialMeta.difficulty =
        difficultyToken.charAt(0).toUpperCase() +
        difficultyToken.slice(1).toLowerCase();
    }
    officialMeta.skill = skillParts
      .join(" ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
      .trim();
  }

  if (!officialMeta.skill && officialMeta.certificateName) {
    officialMeta.skill = officialMeta.certificateName.replace(/\s*\((Basic|Intermediate|Advanced|Expert)\)/i, "").trim();
  }

  const certificateNameDifficultyMatch = officialMeta.certificateName.match(
    /\((Basic|Intermediate|Advanced|Expert)\)/i,
  );
  if (certificateNameDifficultyMatch) {
    officialMeta.difficulty = certificateNameDifficultyMatch[1];
    officialMeta.skill = officialMeta.skill || officialMeta.certificateName.replace(/\s*\((Basic|Intermediate|Advanced|Expert)\)/i, "").trim();
  } else if (skillSlug) {
    const difficultyMatch = skillSlug.match(/(?:^|[_-])(basic|intermediate|advanced|expert)(?:$|[_-])/i);
    if (difficultyMatch) {
      officialMeta.difficulty =
        difficultyMatch[1].charAt(0).toUpperCase() +
        difficultyMatch[1].slice(1).toLowerCase();
    }
  }

  const descriptionText = $(".certificate-description p").first().text().trim();
  if (descriptionText) {
    officialMeta.description = descriptionText;
  }

  const rawData = $("#initialData").html();
  if (rawData) {
    const decodedData = decodeURIComponent(rawData.trim());
    const stateObj = JSON.parse(decodedData);

    const findCert = (obj) => {
      if (!obj || typeof obj !== "object") return null;
      if (
        obj.completed_at &&
        obj.hacker_name &&
        String(obj.certificateId || "").toLowerCase() === certId.toLowerCase()
      ) {
        return obj;
      }
      for (const key of Object.keys(obj)) {
        const res = findCert(obj[key]);
        if (res) return res;
      }
      return null;
    };

    const certData = findCert(stateObj);
    if (certData) {
      officialMeta.candidateName =
        certData.hacker_name || officialMeta.candidateName;
      const certificateTitle = Array.isArray(certData.certificates)
        ? certData.certificates[0]
        : certData.certificates || officialMeta.certificateName;
      officialMeta.certificateName = certificateTitle || officialMeta.certificateName;
      officialMeta.certificateId = certData.certificateId || certId;
      officialMeta.issueDate = certData.completed_at
        ? new Date(certData.completed_at)
        : null;
      if (!officialMeta.skill && officialMeta.certificateName) {
        officialMeta.skill = officialMeta.certificateName.replace(/\s*\((Basic|Intermediate|Advanced|Expert)\)/i, "").trim();
      }
      if (!officialMeta.difficulty) {
        const certDifficultyMatch = String(officialMeta.certificateName || "").match(
          /\((Basic|Intermediate|Advanced|Expert)\)/i,
        );
        if (certDifficultyMatch) {
          officialMeta.difficulty = certDifficultyMatch[1];
        }
      }
    }
  }

  return officialMeta;
};

const findCachedVerifiedHackerRankCertificate = async ({
  userId,
  certificateId,
  verificationUrl,
}) => {
  const filter = { verified: true };
  if (userId) {
    filter.userId = userId;
  }

  const lookups = [];
  if (certificateId) {
    lookups.push({ certificateId });
  }
  if (verificationUrl) {
    lookups.push({ verificationUrl });
  }

  if (!lookups.length) {
    return null;
  }

  return Certificate.findOne({
    ...filter,
    $or: lookups,
  }).sort("-updatedAt");
};

const generateNameVariations = (name) => {
  if (!name) return [];
  const normalized = normalizeString(name);
  const parts = normalized.split(" ").filter(Boolean);
  if (parts.length === 0) return [];
  if (parts.length === 1) return [parts[0]];
  
  const variations = new Set([normalized]);
  const first = parts[0];
  const last = parts[parts.length - 1];
  const middle = parts.slice(1, -1);
  const initials = parts.map(p => p[0]).join("");
  const frontInitials = `${first[0]} ${parts.slice(1).join(" ")}`;
  const backInitials = `${parts.slice(0, -1).join(" ")} ${last[0]}`;
  const reversed = [...parts].reverse().join(" ");
  const missingMiddle = `${first} ${last}`;
  
  variations.add(`${first} ${last}`);
  variations.add(`${last} ${first}`);
  variations.add(initials);
  variations.add(frontInitials);
  variations.add(backInitials);
  variations.add(reversed);
  variations.add(missingMiddle);
  variations.add(first);
  variations.add(last);
  
  return Array.from(variations).map(normalizeString);
};

const computeNameSimilarity = (name1, name2) => {
  if (!name1 || !name2) return 0;
  const n1 = normalizeString(name1);
  const n2 = normalizeString(name2);
  if (n1 === n2) return 100;
  
  const v1 = generateNameVariations(n1);
  const v2 = generateNameVariations(n2);
  
  for (const var1 of v1) {
    if (v2.includes(var1)) return 85; 
  }
  
  const p1 = n1.split(" ");
  const p2 = n2.split(" ");
  const intersection = p1.filter(p => p2.includes(p));
  
  if (intersection.length === p1.length && p1.length > 0) return 70;
  if (intersection.length > 0) return 40;
  
  return 0;
};

const computeConfidenceScore = (officialMeta, userProfile, options) => {
  let score = 0;
  
  if (officialMeta) score += 20;
  if (officialMeta.certificateId && officialMeta.certificateId === options.certificateId) score += 20;
  
  const nameSim = computeNameSimilarity(officialMeta.candidateName, userProfile?.name || userProfile?.username);
  if (nameSim >= 85) score += 30;
  else if (nameSim >= 70) score += 20;
  else if (nameSim >= 40) score += 10;
  
  if (userProfile?.hackerRankUsername && officialMeta.candidateName) {
    if (computeNameSimilarity(officialMeta.candidateName, userProfile.hackerRankUsername) >= 70) {
      score += 15;
    }
  } else {
    score += 15; // Assume match if no profile to verify against but exists
  }
  
  if (officialMeta.skill) score += 10;
  if (officialMeta.issueDate) score += 5;
  
  return Math.min(100, score);
};

const getVerificationStatus = (score) => {
  if (score >= 95) return "Verified";
  if (score >= 85) return "Likely Verified";
  if (score >= 70) return "Manual Review";
  return "Verification Failed";
};

const buildLinkVerificationResult = (officialMeta, verificationUrl, options = {}) => {
  const confidence = computeConfidenceScore(officialMeta, options.userProfile, options);
  const status = getVerificationStatus(confidence);

  return {
    verified: confidence >= 70,
    verificationMethod: "Official HackerRank Link Verification",
    verificationSource: "Official HackerRank Public Certificate Page",
    verificationConfidence: confidence,
    verificationStatus: status,
    verificationUrl,
    verifiedAt: new Date(),
    certificateId: officialMeta.certificateId || options.certificateId || "",
    certificateName: officialMeta.certificateName || "",
    candidateName: officialMeta.candidateName || "",
    issueDate: officialMeta.issueDate || null,
    skill: officialMeta.skill || "",
    difficulty: officialMeta.difficulty || "",
    description: officialMeta.description || "",
    certificateFormat: options.isIframe ? "Iframe" : "Official",
  };
};

const verifyHackerRankCertificateLink = async (
  rawUrl,
  options = {},
) => {
  const parsed = parseHackerRankCertificateUrl(rawUrl);
  if (!parsed) {
    const error = new Error(
      "Invalid HackerRank verification URL. Only official public certificate URLs are allowed.",
    );
    error.status = 400;
    throw error;
  }

  const verificationUrl = parsed.canonicalUrl;

  if (!options.forceVerify) {
    const cached = await findCachedVerifiedHackerRankCertificate({
      userId: options.userId,
      certificateId: parsed.certificateId,
      verificationUrl,
    });

    if (cached) {
      console.log(
        `Using cached verification for HackerRank certificate ${parsed.certificateId}`,
      );
      return {
        verified: cached.verified,
        verificationMethod: cached.verificationMethod,
        verificationSource: cached.verificationSource,
        verificationConfidence: cached.verificationConfidence,
        verificationStatus: cached.verificationStatus,
        verificationUrl: cached.verificationUrl || verificationUrl,
        verifiedAt: cached.verifiedAt || new Date(),
        certificateId: cached.certificateId || parsed.certificateId,
        certificateName: cached.certificateName || cached.name || "",
        candidateName: cached.candidateName || "",
        issueDate: cached.issueDate || null,
        skill: cached.skill || "",
        difficulty: cached.difficulty || "",
        description: cached.extractedMetadata?.description || "",
        certificateFormat: cached.certificateFormat || (parsed.isIframe ? "Iframe" : "Official"),
        certificate: cached,
        cached: true,
      };
    }
  }

  let html = "";
  try {
    html = await fetchOfficialHackerRankPage(verificationUrl);
  } catch (err) {
    const error = new Error(mapVerificationNetworkError(err));
    error.status = err.response?.status || err.status || 400;
    throw error;
  }

  let officialMeta;
  try {
    officialMeta = parseOfficialPageMetadata(html, parsed.certificateId);
  } catch (err) {
    const error = new Error(
      "Verification failed: unable to parse the official HackerRank certificate page.",
    );
    error.status = 502;
    throw error;
  }

  if (!officialMeta.certificateName && !officialMeta.candidateName) {
    const error = new Error(
      "Verification failed: the certificate page format appears to be malformed or unsupported.",
    );
    error.status = 502;
    throw error;
  }

  let userProfile = null;
  if (options.userId) {
    const user = await User.findById(options.userId);
    const hrProfile = await HackerRankProfile.findOne({ userId: options.userId });
    if (user || hrProfile) {
      userProfile = {
        name: user?.name,
        username: user?.username,
        hackerRankUsername: hrProfile?.username
      };
    }
  }

  return buildLinkVerificationResult(officialMeta, verificationUrl, {
    certificateId: parsed.certificateId,
    isIframe: parsed.isIframe,
    userProfile,
  });
};

const verifyHackerRankCertificate = async (pdfPath, options = {}) => {
  const pdfMeta =
    options.pdfMeta ||
    (await extractCertificateData(pdfPath, options.originalName || ""));
  const certificateFormat = detectCertificateFormat(pdfMeta);

  const result = {
    verified: false,
    verificationMethod: "Extraction Failed",
    verificationSource: "",
    verificationConfidence: 0,
    verificationStatus: "Certificate metadata could not be extracted.",
    verificationUrl: pdfMeta.verificationUrl || "",
    verifiedAt: null,
    certificateId: pdfMeta.certificateId || "",
    certificateName: pdfMeta.certificateName || pdfMeta.name || "",
    certificateFormat,
    candidateName: pdfMeta.candidateName || "",
    issueDate: pdfMeta.issueDate || null,
    skill: pdfMeta.skill || "",
    difficulty: pdfMeta.difficulty || "",
    language: pdfMeta.language || "",
    rawExtractedText: pdfMeta.rawExtractedText || "",
    ocrUsed: !!pdfMeta.ocrUsed,
    ocrConfidence: pdfMeta.ocrConfidence,
    extractionError: pdfMeta.extractionError || "",
  };

  const targetUrl = normalizeHackerRankVerificationUrl(pdfMeta.verificationUrl);

  if (targetUrl) {
    try {
      const verification = await verifyHackerRankCertificateLink(targetUrl, {
        forceVerify: options.forceVerify,
        userId: options.userId,
      });

      return {
        ...result,
        ...verification,
        certificateName: verification.certificateName || result.certificateName,
        candidateName: verification.candidateName || result.candidateName,
        issueDate: verification.issueDate || result.issueDate,
        skill: verification.skill || result.skill,
        difficulty: verification.difficulty || result.difficulty,
        certificateFormat: verification.certificateFormat || "Old",
        rawExtractedText: pdfMeta.rawExtractedText || result.rawExtractedText,
        ocrUsed: !!pdfMeta.ocrUsed,
        ocrConfidence: pdfMeta.ocrConfidence,
        extractionError: pdfMeta.extractionError || "",
      };
    } catch (err) {
      result.verificationMethod = "Verification Failed";
      result.verificationSource = "Official HackerRank Public Certificate Page";
      result.verificationConfidence = 0;
      result.verificationStatus =
        err.status === 400
          ? err.message
          : err.message || "Verification failed while fetching the official HackerRank page.";
      return result;
    }
  }

  if (pdfMeta.certificateId) {
    result.verified = false;
    result.verificationMethod = "OCR Metadata Extraction";
    result.verificationSource = "Uploaded Certificate OCR";
    result.verificationConfidence =
      typeof pdfMeta.ocrConfidence === "number" ? pdfMeta.ocrConfidence : 0;
    result.verificationStatus =
      "Official verification link not found in uploaded certificate.";
    result.certificateFormat = "New";
    return result;
  }

  result.verified = false;
  result.verificationMethod = "Extraction Failed";
  result.verificationSource = "";
  result.verificationConfidence = 0;
  result.verificationStatus =
    "OCR could not extract enough certificate information.";
  result.certificateFormat = "Unknown";
  return result;
};

const runCertificateAiAnalysis = async (certificate, userId, options = {}) => {
  if (
    certificate.aiAnalysis &&
    Object.keys(certificate.aiAnalysis).length > 0 &&
    !options.forceRegenerate
  ) {
    console.log(`Using cached AI analysis for certificate ${certificate._id}`);
    return certificate.aiAnalysis;
  }

  const aiAnalysis = await aiService.analyzeHackerRankCertificate(
    certificate,
    userId,
    {
      forceRegenerate: !!options.forceRegenerate,
      cacheOnly: false,
    },
  );

  if (aiAnalysis) {
    certificate.aiAnalysis = aiAnalysis;
    await certificate.save();
  }

  return aiAnalysis;
};

const saveHackerRankVerifiedCertificate = async (
  user,
  verification,
  options = {},
) => {
  const userId = user.id || user._id;
  const hackerRankProfile = await HackerRankProfile.findOne({ userId });
  const existing = await Certificate.findOne({
    userId,
    certificateId: verification.certificateId || null,
  }).sort("-updatedAt");

  const certificateData = {
    userId,
    hackerRankProfileId: hackerRankProfile?._id || existing?.hackerRankProfileId,
    fileName:
      existing?.fileName ||
      `hackerrank-certificate-${verification.certificateId || "link"}.html`,
    filePath:
      existing?.filePath ||
      verification.verificationUrl ||
      `https://www.hackerrank.com/certificates/${verification.certificateId || "link"}`,
    name:
      verification.certificateName ||
      existing?.name ||
      verification.skill ||
      "",
    candidateName:
      verification.candidateName ||
      existing?.candidateName ||
      "",
    certificateName:
      verification.certificateName ||
      existing?.certificateName ||
      verification.skill ||
      "",
    issueDate: verification.issueDate || existing?.issueDate || null,
    language: verification.language || existing?.language || "",
    skill: verification.skill || existing?.skill || "",
    difficulty: verification.difficulty || existing?.difficulty || "",
    verified: verification.verified,
    verificationUrl: verification.verificationUrl || existing?.verificationUrl || "",
    verificationMethod: verification.verificationMethod,
    verificationSource: verification.verificationSource,
    verificationConfidence: verification.verificationConfidence,
    verificationStatus: verification.verificationStatus,
    verifiedAt: verification.verifiedAt,
    certificateId: verification.certificateId || existing?.certificateId || null,
    certificateFormat: verification.certificateFormat,
    ocrUsed: verification.ocrUsed ?? existing?.ocrUsed ?? false,
    rawExtractedText: verification.rawExtractedText || existing?.rawExtractedText || "",
    extractedMetadata: {
      ...(existing?.extractedMetadata || {}),
      candidateName: verification.candidateName || existing?.candidateName || "",
      certificateName:
        verification.certificateName || existing?.certificateName || "",
      certificateId: verification.certificateId || existing?.certificateId || "",
      verificationUrl:
        verification.verificationUrl || existing?.verificationUrl || "",
      issueDate: verification.issueDate || existing?.issueDate || null,
      skill: verification.skill || existing?.skill || "",
      difficulty: verification.difficulty || existing?.difficulty || "",
      language: verification.language || existing?.language || "",
      ocrUsed: verification.ocrUsed ?? existing?.ocrUsed ?? false,
      ocrConfidence: verification.ocrConfidence ?? existing?.ocrConfidence,
      extractionError: verification.extractionError || existing?.extractedMetadata?.extractionError || "",
      description: verification.description || existing?.extractedMetadata?.description || "",
    },
  };

  const certificate = existing
    ? Object.assign(existing, certificateData)
    : new Certificate(certificateData);

  await certificate.save();

  if (
    !certificate.aiAnalysis ||
    Object.keys(certificate.aiAnalysis || {}).length === 0 ||
    options.forceRegenerate
  ) {
    await runCertificateAiAnalysis(certificate, userId, options);
  }

  return certificate;
};

exports.verifyHackerRankCertificateLink = verifyHackerRankCertificateLink;
exports.saveHackerRankVerifiedCertificate = saveHackerRankVerifiedCertificate;

exports.uploadCertificate = async (user, file, options = {}) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const blockedExtensions = [
    ".exe",
    ".bat",
    ".cmd",
    ".com",
    ".msi",
    ".scr",
    ".zip",
    ".rar",
    ".7z",
    ".tar",
    ".gz",
  ];

  if (
    ext !== ".pdf" ||
    file.mimetype !== "application/pdf" ||
    blockedExtensions.includes(ext)
  ) {
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (e) {}
    const err = new Error("Invalid file format. Only PDF files are allowed.");
    err.status = 400;
    throw err;
  }

  let metadata;
  try {
    metadata = await extractCertificateData(file.path, file.originalname);
  } catch (error) {
    console.error("Certificate extraction error:", error.message);
    metadata = {
      name: file.originalname
        .replace(path.extname(file.originalname), "")
        .replace(/[-_]/g, " ")
        .trim(),
      issueDate: null,
      language: "",
      skill: "",
      difficulty: "",
      candidateName: "",
      certificateName: "",
      certificateId: "",
      verificationUrl: "",
      rawExtractedText: "",
      ocrUsed: true,
      ocrConfidence: undefined,
      extractionError: error.message || "OCR extraction failed.",
    };
  }

  const verification = await verifyHackerRankCertificate(file.path, {
    forceVerify: options.forceVerify,
    originalName: file.originalname,
    pdfMeta: metadata,
  });

  const hackerRankProfile = await HackerRankProfile.findOne({
    userId: user._id,
  });

  const certificate = await Certificate.create({
    userId: user._id,
    hackerRankProfileId: hackerRankProfile?._id,
    fileName: file.originalname,
    filePath: file.path,
    name:
      verification.certificateName ||
      metadata.certificateName ||
      metadata.name,
    candidateName: verification.candidateName || metadata.candidateName || "",
    certificateName:
      verification.certificateName || metadata.certificateName || "",
    issueDate: verification.issueDate || metadata.issueDate,
    language: verification.language || metadata.language,
    skill: verification.skill || metadata.skill,
    difficulty: verification.difficulty || metadata.difficulty,
    verified: verification.verified,
    verificationUrl: verification.verificationUrl,
    verificationMethod: verification.verificationMethod,
    verificationSource: verification.verificationSource,
    verificationConfidence: verification.verificationConfidence,
    verificationStatus: verification.verificationStatus,
    verifiedAt: verification.verifiedAt,
    certificateId: verification.certificateId || metadata.certificateId || null,
    certificateFormat: verification.certificateFormat,
    ocrUsed: verification.ocrUsed,
    rawExtractedText: verification.rawExtractedText || metadata.rawExtractedText,
    extractedMetadata: {
      candidateName: metadata.candidateName,
      certificateName: metadata.certificateName,
      certificateId: metadata.certificateId,
      verificationUrl: metadata.verificationUrl,
      issueDate: metadata.issueDate,
      skill: metadata.skill,
      difficulty: metadata.difficulty,
      language: metadata.language,
      ocrUsed: metadata.ocrUsed,
      ocrConfidence: metadata.ocrConfidence,
      extractionError: metadata.extractionError,
    },
  });

  if (
    verification.verified ||
    metadataExtractionSucceeded(metadata)
  ) {
    await runCertificateAiAnalysis(certificate, user._id, options);
  }

  return certificate;
};

exports.verifyExistingCertificate = async (user, certificateId, options = {}) => {
  const userId = user.id || user._id;
  const certificate = await Certificate.findOne({
    _id: certificateId,
    userId,
  });
  
  if (!certificate) {
    const error = new Error("Certificate not found.");
    error.status = 404;
    throw error;
  }
  
  if (certificate.verified && !options.forceVerify) {
    console.log(`Using cached verification for existing certificate ${certificateId}`);
    return {
      verified: certificate.verified,
      verificationMethod: certificate.verificationMethod,
      verificationSource: certificate.verificationSource,
      verificationConfidence: certificate.verificationConfidence,
      verificationStatus: certificate.verificationStatus,
      verificationUrl: certificate.verificationUrl,
      verifiedAt: certificate.verifiedAt,
      certificate,
    };
  }

  const verification = await verifyHackerRankCertificate(certificate.filePath, {
    forceVerify: !!options.forceVerify,
    originalName: certificate.fileName,
  });

  certificate.verified = verification.verified;
  certificate.verificationUrl = verification.verificationUrl;
  certificate.verificationMethod = verification.verificationMethod;
  certificate.verificationSource = verification.verificationSource;
  certificate.verificationConfidence = verification.verificationConfidence;
  certificate.verificationStatus = verification.verificationStatus;
  certificate.verifiedAt = verification.verifiedAt;
  certificate.certificateId = verification.certificateId || null;
  certificate.certificateFormat = verification.certificateFormat;
  certificate.ocrUsed = verification.ocrUsed;
  certificate.rawExtractedText =
    verification.rawExtractedText || certificate.rawExtractedText;

  if (verification.certificateName) {
    certificate.name = verification.certificateName;
  }
  if (verification.certificateName) {
    certificate.certificateName = verification.certificateName;
  }
  if (verification.candidateName) {
    certificate.candidateName = verification.candidateName;
  }
  if (verification.issueDate) {
    certificate.issueDate = verification.issueDate;
  }
  if (verification.skill) {
    certificate.skill = verification.skill;
  }
  if (verification.difficulty) {
    certificate.difficulty = verification.difficulty;
  }
  if (verification.language) {
    certificate.language = verification.language;
  }

  certificate.extractedMetadata = {
    ...(certificate.extractedMetadata || {}),
    candidateName: verification.candidateName,
    certificateName: verification.certificateName,
    certificateId: verification.certificateId,
    verificationUrl: verification.verificationUrl,
    issueDate: verification.issueDate,
    skill: verification.skill,
    difficulty: verification.difficulty,
    language: verification.language,
    ocrUsed: verification.ocrUsed,
    ocrConfidence: verification.ocrConfidence,
    extractionError: verification.extractionError,
  };

  if (
    verification.verified ||
    metadataExtractionSucceeded(verification)
  ) {
    await runCertificateAiAnalysis(certificate, user._id, options);
  } else {
    await certificate.save();
  }

  return {
    verified: certificate.verified,
    verificationMethod: certificate.verificationMethod,
    verificationSource: certificate.verificationSource,
    verificationConfidence: certificate.verificationConfidence,
    verificationStatus: certificate.verificationStatus,
    verificationUrl: certificate.verificationUrl,
    verifiedAt: certificate.verifiedAt,
    certificate
  };
};

exports.getCertificates = async (userId) => {
  return Certificate.find({ userId }).sort("-createdAt");
};

exports.deleteCertificate = async (user, certificateId) => {
  const userId = user.id || user._id;
  const certificate = await Certificate.findOne({
    _id: certificateId,
    userId,
  });
  if (!certificate) {
    const error = new Error("Certificate not found.");
    error.status = 404;
    throw error;
  }

  const certificateUploadDir = path.resolve("public/uploads/certificates");
  const certificatePath = certificate.filePath
    ? path.resolve(certificate.filePath)
    : "";

  await Certificate.deleteOne({ _id: certificate._id });
  await AICache.deleteMany({
    userId,
    featureName: {
      $in: [
        "hackerrank-certificate-analysis",
        `hackerrank-certificate-analysis:${certificate._id.toString()}`,
      ],
    },
  });

  if (
    certificatePath &&
    (certificatePath === certificateUploadDir ||
      certificatePath.startsWith(`${certificateUploadDir}${path.sep}`))
  ) {
    try {
      await fs.promises.unlink(certificatePath);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
};

exports.getCandidateSummary = async (
  requestingUser,
  targetUserId,
  options = {},
) => {
  const user = await User.findById(targetUserId).lean();
  const githubProfile = await GitHubProfile.findOne({
    userId: targetUserId,
  }).lean();
  const repos = await GitHubRepository.find({ user: targetUserId }).lean();
  const leetCodeProfile = await LeetCodeProfile.findOne({
    userId: targetUserId,
  }).lean();
  const hackerRankProfile = await HackerRankProfile.findOne({
    userId: targetUserId,
  }).lean();
  const certificates = await Certificate.find({ userId: targetUserId }).lean();

  const summary = await aiService.summarizeCandidateCodingProfile(
    {
      githubProfile,
      leetCodeProfile,
      hackerRankProfile,
      certificates,
      repos,
      user,
    },
    user,
    targetUserId,
    {
      forceRegenerate: !!(options && options.forceRegenerate),
      cacheOnly: !(options && options.forceRegenerate),
    },
  );

  const analytics = computeDeveloperAnalytics(
    leetCodeProfile,
    hackerRankProfile,
    certificates,
    githubProfile,
    summary
  );

  return {
    githubProfile,
    leetCodeProfile,
    hackerRankProfile,
    certificates,
    summary,
    analytics,
  };
};

const computeDeveloperAnalytics = (leetCode, hackerRank, certificates, github, aiSummary) => {
  const hrStats = {
    uploaded: certificates?.length || 0,
    verified: 0,
    pending: 0,
    failed: 0,
    rate: 0
  };
  
  const knownSkillsMap = new Map();

  const skillMapping = {
    "sql": ["SQL"],
    "java": ["Java"],
    "python": ["Python"],
    "problem solving": ["Algorithms", "Data Structures", "Logic Building"],
    "rest api": ["REST API", "Backend"],
    "javascript": ["JavaScript", "Web Development"],
    "react": ["React", "Frontend"],
    "node.js": ["Node.js", "Backend"],
    "node": ["Node.js", "Backend"],
    "c++": ["C++", "OOP", "Pointers", "Memory Management"],
    "linux": ["Linux", "Operating Systems", "Shell"]
  };

  const addSkill = (name, confidence = 50) => {
    if (!name) return;
    const existing = knownSkillsMap.get(name) || 0;
    knownSkillsMap.set(name, Math.max(existing, confidence));
  };

  (certificates || []).forEach(cert => {
    if (cert.verificationStatus === "Verified") hrStats.verified++;
    else if (cert.verificationStatus === "Verification Failed") hrStats.failed++;
    else hrStats.pending++;

    if (cert.verified) {
      const skillName = cert.skill?.toLowerCase().replace(/\s*\(basic\)|\s*\(intermediate\)|\s*\(advanced\)/g, "").trim();
      const mapped = skillMapping[skillName] || [cert.skill];
      mapped.forEach(s => addSkill(s, cert.verificationConfidence || 85));
    }
  });

  if (hrStats.uploaded > 0) {
    hrStats.rate = Math.round((hrStats.verified / hrStats.uploaded) * 100);
  }

  const hrTimeline = [...(certificates || [])]
    .filter(c => c.issueDate)
    .sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));

  if (leetCode?.skills) {
    leetCode.skills.forEach(s => addSkill(s, 95));
  }

  const knownSkills = Array.from(knownSkillsMap.entries())
    .map(([name, confidence]) => ({ name, confidence }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const groups = {
    "Programming Languages": ["Java", "Python", "C++", "JavaScript", "SQL", "C", "C#", "Go", "Ruby", "Rust"],
    "Frontend": ["HTML", "CSS", "React", "Angular", "Vue", "Frontend", "Web Development"],
    "Backend": ["Node.js", "Express", "REST API", "Spring", "Backend", "Django", "Flask"],
    "Database": ["SQL", "MySQL", "MongoDB", "PostgreSQL", "Redis", "Database"],
    "Algorithms": ["Problem Solving", "Data Structures", "Dynamic Programming", "Graphs", "Trees", "Binary Search", "Greedy", "Algorithms", "Logic Building", "Math", "String", "Array"],
    "Software Engineering": ["Git", "OOP", "Debugging", "Testing", "Pointers", "Memory Management", "Linux", "Operating Systems", "Shell", "Design"]
  };

  const skillGroups = {};
  Object.keys(groups).forEach(category => {
    skillGroups[category] = knownSkills.filter(s => 
      groups[category].some(g => s.name.toLowerCase().includes(g.toLowerCase()))
    ).map(s => s.name);
  });

  let score = 50;
  score += Math.min(25, hrStats.verified * 5);
  score += Math.min(15, ((leetCode?.totalSolved || 0) / 1000) * 15);
  score += Math.min(15, ((leetCode?.contestRating || 0) / 3000) * 15);
  score += Math.min(20, knownSkills.length * 1);
  const lastSync = leetCode?.lastSynced || hackerRank?.lastSynced;
  if (lastSync) {
    const daysSince = (new Date() - new Date(lastSync)) / (1000 * 60 * 60 * 24);
    if (daysSince > 30) score -= Math.min(10, (daysSince - 30) / 3);
  }
  const developerScore = Math.max(0, Math.min(100, Math.round(score)));

  return {
    hackerRankStats: hrStats,
    hackerRankTimeline: hrTimeline,
    knownSkills,
    skillGroups,
    developerScore,
    techStackSummary: {
      languages: skillGroups["Programming Languages"],
      frameworks: [...skillGroups["Frontend"], ...skillGroups["Backend"]],
      databases: skillGroups["Database"],
      coreCS: skillGroups["Algorithms"],
      tools: skillGroups["Software Engineering"]
    }
  };
};
