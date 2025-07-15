# No-Build React JSX Demo

A minimal React application that runs JSX directly in the browser without any build tools or compilation step.

## How It Works

- **Service Worker**: Intercepts `.js` and `.jsx` file requests and transpiles JSX to JavaScript using Babel standalone
- **Import Maps**: Loads React 19.1.0 directly from esm.sh CDN
- **ES Modules**: Uses native browser module support for component imports
- **Real-time Transpilation**: JSX is transformed on-the-fly in the browser

## Project Structure

```
index.html              # Entry point with importmap and service worker
service-worker.js       # Babel JSX transpiler
components/
├── App.jsx            # Main app component  
└── HelloWorld.jsx     # Example child component
```

## Usage

1. Serve the files from an HTTP server (required for service workers)
2. Open `index.html` in a modern browser
3. The service worker will automatically transpile JSX files as they're imported

## Requirements

- Modern browser with ES modules and service worker support
- HTTP server (service workers don't work with `file://` protocol)
- Internet connection (for CDN dependencies)

## Features

✅ No build tools or compilation step  
✅ No npm install required  
✅ Real-time JSX transpilation  
✅ Modern React 19 with createRoot API  
✅ ES module imports  
✅ Works on first page load  

Perfect for prototyping, learning, or minimal React demos! 