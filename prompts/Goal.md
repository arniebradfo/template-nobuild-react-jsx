I would like to create a "no-build" React with jsx project that loads using esm in the browser. We can you the most modern js available.

Only issue is: we want to transpile the jsx into es module syntax using a service worker that runs babel-standalone on the imported jsx files. 

General Idea:
- index.html should be the minimal entry to the project
- load react & react-dom using an `importmap`
- load the service worker to intercept js imports and transpile react jsx to esm
- load a components/App.jsx that imports other component/ jsx files via `import` statements

Considerations:
- we don't care about css right now
- We cannot use NPM, these must be all static files, no compile, no build, no install. all dependencies must come from CDNs.
- We don't care about browser performance. It is fine to run everything in the browser.
- Assume this is hosted on an http server. We are not concerned with how.

For react import maps use something like:

```html
<script type="importmap">
  {
    "imports": {
      "react": "https://esm.sh/react@19.1.0",
      "react-dom/": "https://esm.sh/react-dom@19.1.0/"
    }
  }
</script>
<script type="module">
  import React from "react"; // → https://esm.sh/react@19.1.0
  import ReactDOM from "react-dom/client"; // → https://esm.sh/react-dom@19.1.0/client
  import { App } from './components/App'
  ReactDOM.render(<App />, document.querySelector("#root"));
</script>
```

Get `@babel/standalone` from one of these CDNs:
 - https://esm.sh/babel-standalone@6
 - https://unpkg.com/@babel/standalone/babel.min.js

I have included an @Article.md and @GitHub-Thread.md  and @GitHub-Comment.md  related to this service worker technique, but they are older so some of the shims and techniques are no longer required.

Please ask me several questions about implementation so we can start to make a plan. We want to make the most minimal tech demo possible to show the idea.
