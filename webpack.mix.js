const mix = require('laravel-mix')

require('laravel-mix-tailwind')
require('laravel-mix-purgecss')
require('laravel-mix-imagemin')
require('svg-spritemap-webpack-plugin')
require('@ayctor/laravel-mix-svg-sprite')

const src = `src`
const site = 'ocean-explorer'
const dist = `${site}/public`

mix.js(`${src}/js/main.js`, `${dist}/js/app.js`)
  .sass(`${src}/css/main.scss`, `${dist}/css/styling.css`)
  .sass(`${src}/css/font-license.scss`, `${dist}/css`)
  .tailwind('./tailwind.config.js')
  .purgeCss({
    globs: [
      path.join(__dirname, `${src}/views/**/*.pug`),
      path.join(__dirname, `${src}/js/**/*.{js,vue}`),
    ],
    extractorPattern: /[a-zA-Z0-9-:%_/]+/g,
    whitelistPatterns: [
      /enter$/, /enter-active$/, /enter-to$/,
      /leave$/, /leave-active$/, /leave-to$/,
      /show$/,
    ],
  })
  .imagemin(
    {
      from: `${src}/img/`,
      ignore: ['.gitignore', '.DS_Store'],
      to: `img/`
    }, {}, {
      test: `${dist}/img/*`,
      optipng: {
        optimizationLevel: 5
      }
    }
  )
  .svgSprite(`${src}/icons/*.svg`, {
    output: {
      filename: `sprite.svg`,
      svg4everybody: false,
      svgo: {
        removeTitle: true,
        removeStyleElement: true,
        cleanupNumericValue: true
      }
    }
  })
  .copyDirectory(`${src}/fonts`, `${dist}/fonts`)
  .copyDirectory(`${src}/views`, `${site}/views`)
  .setPublicPath(`${dist}/`)
