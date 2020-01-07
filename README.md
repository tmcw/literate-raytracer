# Literate Ray Tracer Fork

This is a [fork](https://github.com/tmcw/literate-raytracer) of [literate-ray-tracer](http://macwright.org/literate-raytracer/ "Literate ray tracer")

This is a literate [raytracer](http://en.wikipedia.org/wiki/Ray_tracing_(graphics)),
written in Javascript. The 
are all one part: you can understand the implementation by reading it in combination
with literate-style code comments.

This is intended as a learning platform for those trying to connect the mathematical
and engineering explanations of raytracing and understand the behavior of the algorithm
well enough to do interesting things.

[See It Live Here](https://literate-raytracer.michaeljbennett.info "Live version of this book")

###

Please [report and defects here](https://github.com/bennett000/literate-raytracer/issues "Report an issue with the book") and we'll attempt to address the issue in the next release


## Having Fun With The Code

Unlike the original, the JavaScript parts of this codebase are written in TypeScript,
consequently you'll need some tooling to play.

By JS community standards the requirements are minimal... if there's demand to include the raw JS we can arrange that.

Right now the source is all under `src/` in TypeScript files.

### Installing Dependencies

You'll need a relatively modern version of [node js](https://nodejs.org/en/ "Node JS a CLI based JS environment").  With that installed navigate to the source folder and `npm install` _or alternatively_ `yarn install`

### Running in Dev Mode

* `npm run dev` _or alternatively_ `yarn dev` will watch for changes to `*.ts` files and build an `index.js`.  Open `index.html` (the one in the source root) and refresh it to play.  Every time you change TS files, the project will auto rebuild, you just need to refresh the browser.
* `npm run build` _or alternatively_ `yarn build` is effectively `dev` mode but it builds the app once

### Building The Book
* `npm run doc` _or alternatively_ `yarn doc` will build the book and put it in the source
code's `doc` folder

## License

In the spirit of the base code, this code and accompanying text is released under CC0, or Public Domain where applicable.
