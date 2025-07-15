// Service Worker for JSX transpilation using Babel standalone
// Intercepts .js/.jsx files and transforms JSX to regular JavaScript

// Activate immediately without waiting for page reload
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Load Babel standalone during install
self.addEventListener("install", (event) => {
  event.waitUntil(loadBabel());
});

async function loadBabel() {
  try {
    // Load Babel standalone from CDN
    const response = await fetch("https://unpkg.com/@babel/standalone/babel.min.js");
    const babelCode = await response.text();
    eval(babelCode);
    console.log("Babel standalone loaded successfully");
  } catch (error) {
    console.error("Failed to load Babel standalone:", error);
  }
}

// Intercept fetch requests
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only process .js and .jsx files from the same origin
  if ((url.pathname.endsWith(".js") || url.pathname.endsWith(".jsx")) && url.origin === self.location.origin) {
    event.respondWith(handleJSXRequest(event.request));
  }
});

async function handleJSXRequest(request) {
  try {
    // Fetch the original file
    const response = await fetch(request);
    const jsxCode = await response.text();

    // Transform JSX using Babel
    const transformedCode = self.Babel.transform(jsxCode, {
      presets: ["react"],
    }).code;

    console.log(`Transformed: ${request.url}`);

    // Return transformed JavaScript
    return new Response(transformedCode, {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error(`Error transforming ${request.url}:`, error);
    // Return original response on error
    return fetch(request);
  }
}
