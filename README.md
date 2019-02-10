# TGView
The TGView System is a browser-based theory graph viewer developed at the [KWARC group](http://kwarc.info) at [FAU Erlangen-Nürnberg](http://www.fau.de) by Marcel Rupprecht (with help/supervision by Dennis Müller and Michael Kohlhase).  

We value your feedback, please consult the [GitHub issues](issues/) for planned extensions and feel free to [open  a new issue](issues/new) if you have comments. 

## Documentation
There is a [MathUI-2017 paper](https://kwarc.info/kohlhase/papers/mathui17-tgview.pdf) that describes
the system at a conceptual level. Technical information can be found in the [TGView Wiki](https://github.com/UniFormal/TGView/wiki)

## find help
[Help Pages](https://github.com/UniFormal/TGView/wiki/Help-Pages)

## Running TGView

TGView has been ported to use TypeScript. 
To install all dependencies we make use of [`yarn`](https://yarnpkg.com/en/): 

```bash
# To install all dependencies
yarn

# To start up a development server that automatically recompiles when sources are changed
yarn start

# To build a static distribution into the dist/ folder (which can be served under any server)
yarn build
```

As an editor, it is highly recommended to use [Visual Studio Code](https://code.visualstudio.com/) as it has built-in support for TypeScript. 
Furthermore, the excellent [Debugger for Chrome](https://marketplace.visualstudio.com/items?itemName=msjsdiag.debugger-for-chrome) extension can be used. 

## Using TGView as a library

To use TGView as a library in other Webpack / JavaScript / TypeScript projects, a `package.json` file is provided. 
During installation of the package this file will automatically cause the TypeScript Compiler to generate pure JavaScript code into the `lib/` folder. 
This code can then be used as an entry point of other scripts. 