// Builds an authentic PNG sample in memory with embedded tEXt provenance chunks
// so live demos and manual samples exercise real binary inspection and sanitization offline.
export async function buildDemoAiTaggedPng(): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = 960;
  canvas.height = 640;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context unavailable");
  }

  ctx.fillStyle = "#f8f7f4";
  ctx.fillRect(0, 0, 960, 640);

  ctx.strokeStyle = "#e4e0d8";
  ctx.lineWidth = 1;
  for (let x = 40; x < 960; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 640);
    ctx.stroke();
  }
  for (let y = 40; y < 640; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(960, y);
    ctx.stroke();
  }

  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#0d9488";
  ctx.lineWidth = 3;
  ctx.fillRect(130, 125, 700, 390);
  ctx.strokeRect(130, 125, 700, 390);

  ctx.fillStyle = "#141619";
  ctx.font = "bold 38px sans-serif";
  ctx.fillText("Sample AI-Tagged Image", 180, 285);

  ctx.fillStyle = "#0d9488";
  ctx.font = "600 20px sans-serif";
  ctx.fillText(
    "Includes test C2PA, ChatGPT, and DigitalSourceType tags",
    180,
    332,
  );

  ctx.fillStyle = "#5c626b";
  ctx.font = "16px sans-serif";
  ctx.fillText(
    "Run Scrub Active Image to re-encode clean pixels locally.",
    180,
    376,
  );

  const rawBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Sample PNG encoding failed"));
    }, "image/png");
  });

  const baseBytes = new Uint8Array(await rawBlob.arrayBuffer());
  const textChunks = [
    createPngTextChunk("Software", "ChatGPT Image Generator"),
    createPngTextChunk(
      "DigitalSourceType",
      "http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia",
    ),
    createPngTextChunk(
      "c2pa.claim",
      "jumb:c2pa:urn:uuid:c2pa-demo-provenance-manifest",
    ),
    createPngTextChunk(
      "parameters",
      "Architectural studio scene\nNegative prompt: artifacts, watermark",
    ),
  ];

  // PNG signature is 8 bytes + IHDR chunk is 25 bytes = 33 bytes offset
  const headerPart = baseBytes.slice(0, 33);
  const bodyPart = baseBytes.slice(33);
  const extraLength = textChunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const combined = new Uint8Array(baseBytes.length + extraLength);

  combined.set(headerPart, 0);
  let cursor = headerPart.length;
  for (const chunk of textChunks) {
    combined.set(chunk, cursor);
    cursor += chunk.length;
  }
  combined.set(bodyPart, cursor);

  return new File([combined], "sample-ai-metadata.png", {
    type: "image/png",
    lastModified: Date.now(),
  });
}

function createPngTextChunk(keyword: string, text: string): Uint8Array {
  const encoder = new TextEncoder();
  const keyBytes = encoder.encode(keyword);
  const valBytes = encoder.encode(text);
  const dataLength = keyBytes.length + 1 + valBytes.length;

  const chunk = new Uint8Array(12 + dataLength);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, dataLength, false);

  chunk[4] = 0x74;
  chunk[5] = 0x45;
  chunk[6] = 0x58;
  chunk[7] = 0x74;

  chunk.set(keyBytes, 8);
  chunk[8 + keyBytes.length] = 0;
  chunk.set(valBytes, 9 + keyBytes.length);

  const crc = crc32(chunk.slice(4, 8 + dataLength));
  view.setUint32(8 + dataLength, crc >>> 0, false);
  return chunk;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
