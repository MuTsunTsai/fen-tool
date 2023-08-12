In future update, remember to add this line to beginning of the js file:

```js
addEventListener("unhandledrejection", e=>{throw new Error(e.reason)});
```