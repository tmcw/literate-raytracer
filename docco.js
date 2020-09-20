var __slice = [].slice;

const _ = require("underscore");
const fs = require("fs-extra");
const path = require("path");
const marked = require("marked");
const commander = require("commander");
const highlightjs = require("highlight.js");

function document(options) {
  var config;
  if (options == null) {
    options = {};
  }
  config = configure(options);
  fs.mkdirsSync(config.output);
  for (let source of config.sources) {
    const code = fs.readFileSync(source, "utf8");
    const sections = parse(source, code, config);
    format(source, sections, config);
    write(source, sections, config);
  }
}

function parse(source, code, config) {
  var codeText,
    docsText,
    i,
    isText,
    line,
    match,
    maybeCode,
    _i,
    _j,
    _len,
    _len1;
  if (config == null) {
    config = {};
  }
  let lines = code.split("\n");
  let sections = [];
  let lang = getLanguage(source, config);
  let hasCode = (docsText = codeText = "");
  let save = function () {
    sections.push({
      docsText: docsText,
      codeText: codeText,
    });
    return (hasCode = docsText = codeText = "");
  };
  if (lang.literate) {
    isText = maybeCode = true;
    for (i = _i = 0, _len = lines.length; _i < _len; i = ++_i) {
      line = lines[i];
      lines[i] =
        maybeCode && (match = /^([ ]{4}|[ ]{0,3}\t)/.exec(line))
          ? ((isText = false), line.slice(match[0].length))
          : (maybeCode = /^\s*$/.test(line))
          ? isText
            ? lang.symbol
            : ""
          : ((isText = true), lang.symbol + " " + line);
    }
  }
  for (_j = 0, _len1 = lines.length; _j < _len1; _j++) {
    line = lines[_j];
    if (line.match(lang.commentMatcher) && !line.match(lang.commentFilter)) {
      if (hasCode) {
        save();
      }
      docsText += (line = line.replace(lang.commentMatcher, "")) + "\n";
      if (/^(---+|===+)$/.test(line)) {
        save();
      }
    } else {
      hasCode = true;
      codeText += line + "\n";
    }
  }
  save();
  return sections;
}

const format = function (source, sections, config) {
  var code, language, _results;
  language = getLanguage(source, config);
  marked.setOptions({
    highlight: function (code, lang) {
      lang || (lang = language.name);
      if (highlightjs.getLanguage(lang)) {
        return highlightjs.highlight(lang, code).value;
      } else {
        console.warn(
          "docco: couldn't highlight code block with unknown language '" +
            lang +
            "' in " +
            source
        );
        return code;
      }
    },
  });
  _results = [];
  for (let section of sections) {
    code = highlightjs.highlight("js", section.codeText).value;
    code = code.replace(/\s+$/, "");
    section.codeHtml = "<div class='highlight'><pre>" + code + "</pre></div>";
    _results.push((section.docsHtml = marked(section.docsText)));
  }
  return _results;
};

function write(source, sections, config) {
  const destination = function (file) {
    return path.join(
      config.output,
      path.basename(file, path.extname(file)) + ".html"
    );
  };
  const first = marked.lexer(sections[0].docsText)[0];
  const hasTitle = first && first.type === "heading" && first.depth === 1;
  const title = hasTitle ? first.text : path.basename(source);
  const html = config.template({
    sources: config.sources,
    css: path.basename(config.css),
    title: title,
    hasTitle: hasTitle,
    sections: sections,
    path: path,
    destination: destination,
  });
  console.log("docco: " + source + " -> " + destination(source));
  return fs.writeFileSync(destination(source), html);
}

const defaults = {
  layout: "parallel",
  output: "docs",
  template: null,
  css: null,
  extension: null,
  languages: {},
};

function configure(options) {
  var config;
  config = _.extend(
    {},
    defaults,
    _.pick.apply(_, [options].concat(__slice.call(_.keys(defaults))))
  );
  config.languages = languages;
  config.layout = null;
  config.template = _.template(fs.readFileSync(config.template).toString());
  config.sources = options.args
    .filter(function (source) {
      var lang;
      lang = getLanguage(source, config);
      if (!lang) {
        console.warn(
          "docco: skipped unknown type (" + path.basename(source) + ")"
        );
      }
      return lang;
    })
    .sort();
  return config;
}

marked.setOptions({
  smartypants: true,
});

const languages = {
  ".js": {
    commentMatcher: RegExp("^\\s*" + "//" + "\\s?"),
    commentFilter: /(^#![/]|^\s*#\{)/,
    name: "js",
  },
};

const getLanguage = function (source, config) {
  var codeExt, codeLang, ext, lang;
  ext = config.extension || path.extname(source) || path.basename(source);
  lang = config.languages[ext] || languages[ext];
  if (lang && lang.name === "markdown") {
    codeExt = path.extname(path.basename(source, ext));
    if (codeExt && (codeLang = languages[codeExt])) {
      lang = _.extend({}, codeLang, {
        literate: true,
      });
    }
  }
  return lang;
};

function run(args) {
  var c;
  if (args == null) {
    args = process.argv;
  }
  c = defaults;
  commander
    .usage("[options] files")
    .option(
      "-L, --languages [file]",
      "use a custom languages.json",
      _.compose(JSON.parse, fs.readFileSync)
    )
    .option(
      "-l, --layout [name]",
      "choose a layout (parallel, linear or classic)",
      c.layout
    )
    .option("-o, --output [path]", "output to a given folder", c.output)
    .option("-c, --css [file]", "use a custom css file", c.css)
    .option("-t, --template [file]", "use a custom .jst template", c.template)
    .option(
      "-e, --extension [ext]",
      "assume a file extension for all inputs",
      c.extension
    )
    .parse(args).name = "docco";
  if (commander.args.length) {
    return document(commander);
  } else {
    return console.log(commander.helpInformation());
  }
}

run();
