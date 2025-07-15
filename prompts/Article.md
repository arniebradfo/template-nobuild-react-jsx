# React, JSX, ES module imports (dynamic too) in browser without Webpack

<!-- Article Source: https://medium.com/disdj/react-jsx-es-module-imports-dynamic-too-in-browser-without-webpack-9cf39520f20f -->

Jan 17, 2020

This article is an attempt to put together everything available at the moment and see if it is really possible to implement production ready React-based website without pre-compilation like Webpack/Parcel or at least to have as less pre-compilation as possible.

# TL;DR

It is possible to serve React project with minimal compilation of JSX without using bundlers like Webpack or Parcel.

Bundlers pack code into chunks, which has drawbacks: chunks have to be small enough to deliver only what’s needed and big enough to make better use of HTTP1.1 connections. Finding the right balance may be tricky and involves some automatic and manual tuning. In addition it slows down the build and dev mode.

We will use Service Workers to do all the work in runtime and some Babel for production build.

Everything described in the article is highly experimental and I am cutting corners everywhere. By no means I recommend to use any of that in production :)

# Current state

Ability to use ECMAScript modules (`<script type="module"/>` with imports like `import Foo from './foo';` and `import('./Foo')`) directly in browser is quite well known at the moment and has good browser support: [https://caniuse.com/#feat=es6-module](https://caniuse.com/#feat=es6-module).

But in reality we don’t just import our own modules, we import libraries. There is a great article on this topic: [https://salomvary.com/es6-modules-in-browsers.html](https://salomvary.com/es6-modules-in-browsers.html). Also there’s another worth to mention project [https://github.com/stken2050/esm-bundlerless](https://github.com/stken2050/esm-bundlerless).

Among other important things from the articles, these ones will be crucial in order to make React app work:

- Package specifier imports support (or import maps): when we import react in reality we should import something like [https://cdn.com/react/react.production.js](https://cdn.com/react/react.production.js)
- UMD support: React is still distributed as UMD and so far there’s still an ongoing discussion how to publish it using ES modules
- JSX
- Import CSS

Let’s solve these issues one by one.

# Project structure

First things first, let’s assume the project will have the following structure:

- `node_modules` obviously a place where we will install all dependencies
- `src` dir with `index*.html` and service scripts
- `app` app source code

# Package specifier imports support

In order to use React like so `import React from 'react';` we need to tell the browser where to find the actual source. This is quite simple, there's a shim for that: [https://github.com/guybedford/es-module-shims](https://github.com/guybedford/es-module-shims).

Let’s install the shim and React:

```
$ npm i es-module-shims react react-dom --save
```

In order to launch the app we can do something like this in `public/index-dev.html`:

```html
<!DOCTYPE html>  
<html>  
<body>  <div id="root"></div>  <script defer src="../node_modules/es-module-shims/dist/es-module-shims.js"></script>  <script type="importmap-shim">  
    {  
      "imports": {  
        "react": "../node_modules/react/umd/react.development.js",  
        "react-dom": "../node_modules/react-dom/umd/react-dom.development.js"  
      }  
    }  
  </script>  <script type="module-shim">  
    import './app/index.jsx';  
  </script></body>  
</html>
```

Where in `src/app/index.jsx` we will have:

```jsx
import React from 'react';  
import ReactDOM from 'react-dom';  
import './index.css';(async () => {  
  const {Button} = await import('./Button.jsx');  
  const root = document.getElementById('root');  
  ReactDOM.render((  
    <div>  
      <Button>Direct</Button>  
    </div>  
  ), root);  
})();
```

And the `src/app/Button.jsx`:

```jsx
import React from 'react';  
export const Button = ({children}) => <button>{children}</button>;
```

Does it work? Of course, no. Even though we’ve successfully imported everything.

Let’s move on to the next challenge.

# UMD support

## Dynamic way

The issue now is that React is distributed as UMD, it cannot be consumed by imports, [even by the shimmed ones](https://github.com/guybedford/es-module-shims/issues/18) (if the ticket is resolved, just skip this step). So we need to somehow patch the distributable to convince browser that it’s a legit ES modules.

The above mentioned article led me to an idea that we can use Service Workers to intercept and pre-process network requests. Let’s create the main endpoint `src/index.js`, which will bootstrap the SW and App and use it instead of the App directly (`src/app/index.jsx`):

```js
(async () => {  try {  
    const registration = await navigator.serviceWorker.register('sw.js');  
    await navigator.serviceWorker.ready;    const launch = async () => import("./app/index.jsx");    // this launches the React app if the SW has been installed before or immediately after registration  
    // https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle#clientsclaim  
    if (navigator.serviceWorker.controller) {  
      await launch();  
    } else {navigator.serviceWorker.addEventListener('controllerchange', launch);  
    }  } catch (error) {  
    console.error('Service worker registration failed', error);  
  }  
})();
```

And then let’s create the Service Worker (`src/sw.js`):
```js
//this is needed to activate the worker immediately without reload  
//@see https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle#clientsclaim  
self.addEventListener('activate', event => event.waitUntil(clients.claim()));const globalMap = {  
    'react': 'React',  
    'react-dom': 'ReactDOM'  
};const getGlobalByUrl = (url) => Object.keys(globalMap).reduce((res, key) => {  
    if (res) return res;  
    if (matchUrl(url, key)) return globalMap[key];  
    return res;  
}, null);const matchUrl = (url, key) => url.includes(`/${key}/`);self.addEventListener('fetch', (event) => {  const {request: {url}} = event;  console.log('Req', url);  const fileName = url.split('/').pop();  
  const ext = fileName.includes('.') ? url.split('.').pop() : '';  if (!ext && !url.endsWith('/')) {  
    url = url + '.jsx';  
  }  if (globalMap && Object.keys(globalMap).some(key => matchUrl(url, key))) {  
    event.respondWith(  
      fetch(url)  
        .then(response => response.text())  
        .then(body => new Response(`  
          const head = document.getElementsByTagName('head')[0];  
          const script = document.createElement('script');  
          script.setAttribute('type', 'text/javascript');  
          script.appendChild(document.createTextNode(  
            ${JSON.stringify(body)}  
          ));  
          head.appendChild(script);  
          export default window.${getGlobalByUrl(url)};  
        `, {  
          headers: new Headers({  
            'Content-Type': 'application/javascript'  
          })  
        })  
      )  
    )  
  } else if (url.endsWith('.js')) { // rewrite for import('./Panel') with no extension  
    event.respondWith(  
      fetch(url)  
        .then(response => response.text())  
        .then(body => new Response(  
          body,  
          {  
            headers: new Headers({  
              'Content-Type': 'application/javascript'  
            })  
        })  
      )  
    )  
  }});
```
Here’s what we’ve done here:

1. We have created the export map, which associates package id with global var name
2. We have created a `script` tag in `head` with contents of UMD-packaged script
3. We’ve exported the mapped global var as default export of module

For the sake of tech demo this method of patching should be enough, but it may break with other UMD declaration. [Something more robust](https://github.com/jonbretman/amd-to-as6/blob/master/index.js) can be used to process sources.

Now let’s adjust the `src/index-dev.html` to use the bootstrap entry point:
```html
<!DOCTYPE html>  
<html>  
<body>  <div id="root"></div>  <script defer src="../node_modules/es-module-shims/dist/es-module-shims.js"></script>  <script type="importmap-shim">... same as before</script>  <!-- change the file from app/index.jsx to index.js -->  
  <script type="module-shim" src="index.js"></script></body>  
</html>
```
Now we’re able to import React and React DOM.

## Static way

It’s worth to mention, that there’s also another way. We can install ESM distributable:

npm install esm-react --save

And then use following map:
```
{  
  "imports": {  
    "react": "../node_modules/esm-react/src/react.js",  
    "react-dom": "../node_modules/esm-react/src/react-dom.js"  
  }  
}
```
But unfortunately this project is quite stale, latest is `16.8.3` whereas React is `16.10.2`.

# JSX

There are two ways to do the JSX compilation. We can either go traditional way and use Babel to pre-compile or we can use it in runtime. Of course for production it would make much more sense to pre-compile, development mode can be more brutal. Since we already use Service Worker let’s enhance it.

Let’s install a special Babel package that can do it:

```
$ npm install @babel/standalone --save-dev
```

Now let’s add following to the Service Worker (`src/sw.js`):

# src/sw.js  
```js
// at the very top of the file  
importScripts('../node_modules/@babel/standalone/babel.js');// activation stuff as beforeself.addEventListener('fetch', (event) => {  // whatever we had before  } else if (url.endsWith('.jsx')) {  
    event.respondWith(  
      fetch(url)  
        .then(response => response.text())  
        .then(body => new Response(  
          //TODO Cache  
          Babel.transform(body, {  
            presets: [  
              'react',  
            ],  
            plugins: [  
              'syntax-dynamic-import'  
            ],  
              sourceMaps: true  
            }).code,  
            {   
              headers: new Headers({  
                'Content-Type': 'application/javascript'  
              })  
            })  
        )  
    )  
  }});
```

Here we’ve used same approach to intercept the network request and respond with slightly different content, in this case we use Babel to transform the original response. Please note that plugin for dynamic import has a different name `syntax-dynamic-import`, not a usual `@babel/plugin-syntax-dynamic-import` due to Standalone usage.

# CSS

In the above mentioned article author used text transformation, here we will go a bit further and inject the CSS in the page. For that we again will use the Service Worker (`src/sw.js`):

```js
// same as beforeself.addEventListener('fetch', (event) => {  // whatever we had before + Babel stuff  } else if (url.endsWith('.css')) {  
    event.respondWith(  
      fetch(url)  
        .then(response => response.text())  
        .then(body => new Response(  
          //TODO We don't track instances  
          //so 2x import will result in 2x <style> tags  
          `  
            const head = document.getElementsByTagName('head')[0];  
            const style = document.createElement('style');  
            style.setAttribute('type', 'text/css');  
            style.appendChild(document.createTextNode(  
              ${JSON.stringify(body)}  
            ));  
            head.appendChild(style);  
            export default null;  
          `,  
          {  
            headers: new Headers({  
              'Content-Type': 'application/javascript'  
            })  
          })  
        )  
    );  
  }});
```

Et voila! If you now open the `src/index-dev.html` in the browser you'll see the buttons. Make sure the proper Service Worker is being picked up, if you're not sure, open Dev Tools, go to `Application` tab and `Service Workers` section, `Unregister` everything and reload the page.