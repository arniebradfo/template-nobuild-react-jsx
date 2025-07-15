# Using ES Modules with babel-standalone

<!-- github issue source: https://github.com/babel/babel/discussions/12059 -->

Sep 27, 2021

---

Quoting babel docs https://babeljs.io/docs/en/babel-standalone#usage :

> "If you want to use your browser's native support for ES Modules, you'd normally need to set a `type="module"` attribute on your script tag. With `@babel/standalone`, set a `data-type="module"` attribute instead"

For some reason though, when including my main `index.js` file (which imports other js / jsx files using import), it seems like babel is converting my import statements to require statements because I get the `ReferenceError: require is not defined`.

The only way around this I found was to use the `transform-modules-umd` plugin and include all my js files as scripts. Not sure if this is a bug where `data-type="module"` doesn't work or if I'm missing something.

These are my scripts tags in `index.html`

```html
<script src="https://unpkg.com/react@16/umd/react.development.js" crossorigin></script>
<script src="https://unpkg.com/react-dom@16/umd/react-dom.development.js" crossorigin></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<script src="index.js" type="text/babel" data-type="module"></script>
```

Thanks for the help

---

I noticed that babel standalone does not process the ES modules that are imported. Is that a missing feature in babel standalone ?

---

Nope, it's just not in babel scope. You need to include all your scripts to document or intercept requests. Little trick - for development purposes you can use service worker with babel-standalone, which will transform all scripts after fetching. You only need to add some bootstrap code, which register service worker and then execute your scripts.

---

For anyone else looking at this here's my service worker as per the previous suggestion:

service-worker.js:

```js
// transpile JSX using babel so it can be run in the browser, you don't need to edit this
// if you do edit this file, call `await window.serviceWorkerRegistration.unregister()` in the browser to update it

self.addEventListener('install', e => e.waitUntil(getBabel()))
self.addEventListener('fetch', e => e.respondWith(handleRequest(e.request)))

async function getBabel() {
  const r = await fetch('https://unpkg.com/@babel/standalone/babel.min.js')
  eval(await r.text())
}

async function handleRequest(request) {
  const url = new URL(request.url)
  const r = await fetch(request)
  if (r.status === 200 & url.host === location.host && url.pathname.endsWith('.js')) {
    const jsx = await r.text()
    const js = Babel.transform(jsx, {presets: ['react']}).code
    return new Response(js, r)
  } else {
    return r
  }
}

```

And to install it:

```html
<script>
  function onError(err) {
    console.error('Error registering service-worker:', err)
    document.getElementById('root').innerText = err.toString()
  }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js', {scope: '/'})
      .then(registration => {
        window.serviceWorkerRegistration = registration
        // use `await window.serviceWorkerRegistration.unregister()` to unregister the service worker
      })
      .catch(onError)
  } else {
    onError('Browser does not support service workers :-(')
  }
</script>
```

This is working for me (except for the first page load where the service worker isn't registered and everything fails) but I'd love to hear if there's a cleaner/ less hacky solution?
