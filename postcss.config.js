const extractor = require("smelte/src/utils/css-extractor.js");

module.exports = (purge = false) => {
  return [
    require("postcss-nesting")(),
    require("postcss-import")(),
    require("postcss-url")(),
    require("postcss-input-range")(),
    require("autoprefixer")(),
    require("tailwindcss")("./tailwind.config.js"),
    purge &&
      require("cssnano")({
        preset: "default"
      }),
    purge &&
      require("@fullhuman/postcss-purgecss")({
        content: ["./**/*.svelte"],
        extractors: [
          {
            extractor,
            extensions: ["svelte"]
          }
        ],
        whitelist: ["html", "body", "stroke-primary"],
        // for Prismjs code highlighting
        whitelistPatterns: [/language/, /namespace/, /token/]
        // whitelist: [
        //   "html",
        //   "body",
        //   "ripple-gray",
        //   "ripple-primary",
        //   "ripple-white",
        //   "cursor-pointer",
        //   "navigation:hover",
        //   "navigation.selected",
        //   "outline-none",
        //   "stroke-primary",
        //   "text-xs",
        //   "transition"
        // ],
        // whitelistPatterns: [
        //   /bg-gray/,
        //   /text-gray/,
        //   /yellow-a200/,
        //   /language/,
        //   /namespace/,
        //   /token/,
        //   // These are from button examples, infer required classes.
        //   /(bg|ripple|text|border)-(red|teal|yellow|lime|primary|secondary)-(400|500|900|200|50)$/
        // ]
      })
  ].filter(Boolean);
};
