# No-Build React JSX Demo

A minimal React application that runs JSX directly in the browser without any build tools or compilation step.

## How It Works

- **Import Maps**: Loads React 19 directly from esm.sh CDN
- **Babel Transpilation Service Worker**: Intercepts `.js` and `.jsx` file requests and transpiles JSX to JavaScript using Babel standalone
- **ES Modules**: Uses native browser module support for component imports
- **Real-time Transpilation**: JSX is transformed on-the-fly in the browser
- **Deferred App Loading**: The React app is loaded only after the service worker is ready, ensuring all JSX is handled correctly

## Project Structure

```
index.html                      # Entry point with importmap and service worker
service-worker.js               # Service worker entry point
runtime/
├── register-service-worker.js  # Service worker registration and startup logic
├── babel-react-jsx.js          # Babel JSX transpilation engine
└── app-loader.js              # Loads and bootstraps the React app after SW is ready
components/
├── App.jsx                    # Main app component  
└── HelloWorld.jsx             # Example child component
```

## Execution Flow

The application follows a carefully orchestrated startup sequence to ensure JSX transpilation is available before any JSX files are loaded:

1. **`index.html`** - Entry point with React importmap and service worker registration
2. **`register-service-worker.js`** - Registers and waits for service worker to be controlling the page
3. **`service-worker.js`** - Service worker entry point that imports the Babel transpiler. This *must* be in the root directory to have proper scope access
4. **`babel-react-jsx.js`** - Sets up Babel standalone and handles JSX => JS transformation
5. **`app-loader.js`** - Loads React and imports JSX components (only after SW is ready)
6. **`App.jsx`** - Main React application with JSX syntax

## Usage

1. Serve the files from an HTTP server (required for service workers, won't work with `file://` protocol)
2. Open `index.html` in a **modern** browser with ES modules and service worker support
3. The system will automatically follow the execution flow to set up JSX transpilation and load the React app

## Service Worker & Hard Refresh 

**Hard/force refresh (Ctrl+F5, Cmd+Shift+R, etc.)** will [temporarily disable service workers](https://stackoverflow.com/a/49076667/5648839) and cache in modern browsers. The app detects this and will automatically reload the page after a short delay to re-enable the service worker. This is a browser security feature and not a bug.

## Features

✅ No build tools or compilation step  
✅ No npm install required  
✅ Real-time JSX transpilation  
✅ Modern React 19 with createRoot API  
✅ ES module imports  
✅ Works on first page load

Perfect for prototyping, learning, or minimal React demos!
