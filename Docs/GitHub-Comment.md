
# Ability to import UMD modules

<!-- github issue source: https://github.com/guybedford/es-module-shims/issues/18 -->

Jun 17, 2019

---

Currently UMD modules (like `react` or `react-dom`) cannot be imported directly.

I was exploring the current state and found out that, for example, React is published only as UMD, they have a ticket to add ES6 modules to the published versions. But it's a long awaited feature and there's no conclusion on how to export.

Maybe it is possible to address this feature in this library then? It would be a nice step forward.

Some other useful links:

- There's a good article on this topic: https://salomvary.com/es6-modules-in-browsers.html
- Also there's this ticket in UMD repo UMD is not compatible with JavaScript modules umdjs/umd#124


---


Here's the other way, also via Service Worker, quite elegant. The idea is to inject UMD as-is into the page and then export default the global var (this is the code of Service Worker):

```js
// this is needed to activate the worker immediately without reload
//@see https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle
self.addEventListener('activate', event => clients.claim());

const globalMap = {
    'react': 'React',
    'react-dom': 'ReactDOM'
};

const getGlobalByUrl = (url) => Object.keys(globalMap).reduce((res, key) => {
    if (res) return res;
    if (matchUrl(url, key)) return globalMap[key];
    return res;
}, null);

const matchUrl = (url, key) => url.includes(`/${key}/`);

self.addEventListener('fetch', (event) => {

  const {request: {url}} = event;

  console.log('Req', url);

  if (Object.keys(globalMap).some(key => matchUrl(url, key))) {
         event.respondWith(
            fetch(url)
                .then(response => response.text())
                .then(body => new Response(removeSpaces(`
                        const head = document.getElementsByTagName('head')[0];
                        const script = document.createElement('script');
                        script.setAttribute('type', 'text/javascript');
                        script.appendChild(document.createTextNode(${JSON.stringify(body)}));
                        head.appendChild(script);
                        export default window.${getGlobalByUrl(url)};
                    `), {
                        headers: new Headers({
                            'Content-Type': 'application/javascript'
                        })
                    })
                )
        )
  }
});

```

Here's what I've done here:

1. Created the export map, which associates package id with global var name
2. Created a script tag in head with contents of UMD-packaged script
3. Exported the mapped global var as default export of module

The code above makes sure that it's executed as a regular script, so we won't have issues with sudden strict mode when the original package was not designed for it.

