var __slice = [].slice;

const _ = require("underscore");
const fs = require("fs-extra");
const path = require("path");
const marked = require("marked");
const commander = require("commander");
const highlightjs = require("highlight.js");

function document(options, callback) {
  var config;
  if (options == null) {
    options = {};
  }
  config = configure(options);
  return fs.mkdirs(config.output, function () {
    var complete, copyAsset, files, nextFile;
    callback ||
      (callback = function (error) {
        if (error) {
          throw error;
        }
      });
    copyAsset = function (file, callback) {
      return fs.copy(
        file,
        path.join(config.output, path.basename(file)),
        callback
      );
    };
    complete = function () {
      return copyAsset(config.css, function (error) {
        if (error) {
          return callback(error);
        } else if (fs.existsSync(config["public"])) {
          return copyAsset(config["public"], callback);
        } else {
          return callback();
        }
      });
    };
    files = config.sources.slice();
    nextFile = function () {
      var source;
      source = files.shift();
      const buffer = fs.readFile(source);
      var code, sections;
      code = buffer.toString();
      sections = parse(source, code, config);
      format(source, sections, config);
      write(source, sections, config);
      if (files.length) {
        return nextFile();
      } else {
        return complete();
      }
    };
    return nextFile();
  });
}

function parse(source, code, config) {
  var codeText,
    docsText,
    hasCode,
    i,
    isText,
    lang,
    line,
    lines,
    match,
    maybeCode,
    save,
    sections,
    _i,
    _j,
    _len,
    _len1;
  if (config == null) {
    config = {};
  }
  lines = code.split("\n");
  sections = [];
  lang = getLanguage(source, config);
  hasCode = docsText = codeText = "";
  save = function () {
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
  var code, i, language, section, _i, _len, _results;
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
  for (i = _i = 0, _len = sections.length; _i < _len; i = ++_i) {
    section = sections[i];
    code = highlightjs.highlight(language.name, section.codeText).value;
    code = code.replace(/\s+$/, "");
    section.codeHtml = "<div class='highlight'><pre>" + code + "</pre></div>";
    _results.push((section.docsHtml = marked(section.docsText)));
  }
  return _results;
};

function write(source, sections, config) {
  var destination, first, hasTitle, html, title;
  destination = function (file) {
    return path.join(
      config.output,
      path.basename(file, path.extname(file)) + ".html"
    );
  };
  first = marked.lexer(sections[0].docsText)[0];
  hasTitle = first && first.type === "heading" && first.depth === 1;
  title = hasTitle ? first.text : path.basename(source);
  html = config.template({
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
  var config, dir;
  config = _.extend(
    {},
    defaults,
    _.pick.apply(_, [options].concat(__slice.call(_.keys(defaults))))
  );
  config.languages = languages;
  if (options.template) {
    config.layout = null;
  } else {
    dir = config.layout = path.join(__dirname, "resources", config.layout);
    if (fs.existsSync(path.join(dir, "public"))) {
      config["public"] = path.join(dir, "public");
    }
    config.template = path.join(dir, "docco.jst");
    config.css = options.css || path.join(dir, "docco.css");
  }
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
