async function startApp() {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("./service-worker.js");
      console.log("Service Worker registered:", registration);

      // Wait for service worker to be ready and controlling this page
      await navigator.serviceWorker.ready;
      
      console.log("Service Worker ready");

      // If there's already a controller, we're good to go
      // If not, wait for the controllerchange event
      if (navigator.serviceWorker.controller) {
        loadReactApp();
      } else {
        const reloadTimeout = setTimeout(() => {
          if (performance.navigation?.type === performance.navigation.TYPE_RELOAD) {
            // in the case of a force-refresh, the cache is disabled, so the service worker will never run.
            // https://stackoverflow.com/a/49076667/5648839
            console.log('Refresh detected - Service Worker is disabled when refresh is "forced"');
            console.log("Attempting reload to enable Service Worker...");
            location.reload();
          }
        }, 500);

        navigator.serviceWorker.addEventListener("controllerchange", () => {
          clearTimeout(reloadTimeout);
          loadReactApp();
        });
      }
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  } else {
    console.error("Service Workers not supported");
  }
}

async function loadReactApp() {
  // Import the app loader only after service worker is ready
  // This ensures ALL JSX imports happen after SW is controlling
  console.log("Loading app loader...");
  await import("./app-loader.js");
}

// Start the process
startApp();
