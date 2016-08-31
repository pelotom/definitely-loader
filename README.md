# definitely-loader

A [Webpack](https://webpack.github.io/) [loader](https://webpack.github.io/docs/loaders.html) which renders imported modules [definite](https://github.com/pelotom/definitely), such that attempts to reference nonexistent exports thereof generate exceptions.

### Installation
```
$ npm install --save-dev definitely-loader
```

### Example usage
```javascript
import { foo } from 'definitely!./some/module'

doSomething(foo) // throws an error if `baz` is not actually exported by `./some/module`
```

### Rationale
For some source formats there exist Webpack loaders which can statically determine whether imported names are valid (notably for ES6 there is [`eslint-loader`](https://github.com/MoOx/eslint-loader) with the [`import`](https://github.com/benmosher/eslint-plugin-import) plugin). For the rest, this loader offers the next best option: a runtime error.

For example, if you are using the excellent [`css-loader`](https://github.com/webpack/css-loader) to import [locally-scoped styles](https://github.com/webpack/css-loader#css-modules), you still have the problem that you might be trying to reference styles which don't exist in your `.css` file. For example, with this CSS module:

```css
/* MyComponent.css */
.foo {
    background-color: red
}
```

and this React component adjacent to it:

```javascript
// MyComponent.js

import React from 'react'

import styles from './MyComponent.css'

export default class MyComponent extends React.Component {
    render() {
        return (<div className={styles.bar} />) // silently fails!
    }
}
```

the reference to `styles.bar` in the `render` is a bug, because `bar` is not defined in our CSS, but it silently evaluates to `undefined` and the only evidence that anything is wrong is that things won't look as we expect. Hunting down the source of such a bug is far more laborious than it should be. Instead we can make that line generate a runtime error by adding `definitely-loader` to the CSS loader chain in `webpack.config.js`, for example:

```javascript
{
    test: /\.css$/,
    loaders: [
        'definitely',
        'style',
        'css?modules'
    ]
}
```
