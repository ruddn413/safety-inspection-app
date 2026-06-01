import * as pdfjsLib from 'pdfjs-dist';

// Use Vite's ?url syntax to import the worker from node_modules
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export async function convertPdfToImage(file: File): Promise<File> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1); // Only convert the first page
  
  // Calculate optimal scale for high clarity (up to ~4K resolution)
  const unscaledViewport = page.getViewport({ scale: 1.0 });
  const maxDimension = 4096;
  
  let scale = maxDimension / Math.max(unscaledViewport.width, unscaledViewport.height);
  // Ensure the scale is high enough for clarity, but cap it so it doesn't crash the browser
  scale = Math.max(3.0, Math.min(scale, 6.0));

  const viewport = page.getViewport({ scale }); 

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) {
    throw new Error("Could not create canvas context");
  }

  canvas.height = viewport.height;
  canvas.width = viewport.width;

  const renderContext: any = {
    canvasContext: context,
    viewport: viewport,
  };

  await page.render(renderContext).promise;
  
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        // Create a new File object with the JPEG blob
        const newFileName = file.name.replace(/\.pdf$/i, '.jpg');
        resolve(new File([blob], newFileName, { type: 'image/jpeg' }));
      } else {
        reject(new Error("Canvas to Blob conversion failed"));
      }
    }, 'image/jpeg', 1.0); // Maximum quality JPEG
  });
}
