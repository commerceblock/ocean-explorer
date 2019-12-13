module.exports = {
  prefix: '',
  important: false,
  separator: ':',
  theme: {
    // ----- COLORS & SHADOW -----
    colors: {
      green: '#5fc9aa',
      'green-tinted': '#4eb395',
      yellow: '#fbe95e',
      'yellow-tinted': '#f8e553',
      'blue-black': '#2a2f42',
      'royal-blue': '#4256d1',
      // 'orange': '#f09035',
      'sky-blue': '#7dbfe3',
      'teal-blue': '#316286',

      'facebook-blue': '#4267b2',
      'twitter-blue': '#2aa2ef',
      'orange': '#f3794b',

      grey: {
        '900': '#1f212b',
        '800': '#555968',
        '700': '#61636a',
        '600': '#787a80',
        '500': '#a0a4be',
        '300': '#cfd0d2',
        '200': '#f2f3f3',
        '100': '#fafafa'
      },
      white: '#fff',
      'white-faint': 'rgba( 255, 255, 255, 0.02 )',
      'white-mid': 'rgba( 255, 255, 255, 0.7 )',
      'blue-black-trans': 'rgba( 42, 47, 66, 0 )',
      shadow: 'rgba( 42, 47, 66, 0.08 )'
    },
    backgroundColor: theme => ({
      ...theme('colors'),
      primary: theme('colors.white'),
      secondary: theme('colors.blue-black'),
      tertiary: theme('colors.green'),
      quarternary: theme('colors.grey.100'),
      quinary: theme('colors.grey.200'),
    }),
    borderColor: theme => ({
      ...theme('colors'),
      primary: theme('colors.grey.300'),
      'primary-interact': theme('colors.green'),
      secondary: theme('colors.yellow'),
      tertiary: theme('colors.grey.200'),
      quart: theme('colors.grey.800'),
      'btn-sec-border': theme('colors.yellow'),
      'btn-quart-border': theme('colors.grey.200'),
      emph: theme('colors.green'),
      'field-active': theme('colors.teal-blue')
    }),
    textColor: theme => ({
      ...theme('colors'),
      default: theme('colors.grey.700'),
      primary: theme('colors.grey.900'),
      secondary: theme('colors.white'),
      tertiary: theme('colors.grey.600'),
      quarternary: theme('colors.grey.800'),
    }),
    boxShadow: theme => ({
      pri: ( '0 0.375rem 1rem -0.375rem ' + theme('colors.shadow') ),
      sec: ( '0 0.375rem 1rem ' + theme('colors.shadow') )
    }),
    // ----- SPACING & POSITIONS -----
    inset: {
      '0': 0,
      '-0-5r': '-0.5rem',
      '0-5r': '0.5rem',
      '-0-8r': '-0.8rem',
      '1r': '1rem',
      '-1-25r': '-1.25rem',
      '1-25r': '1.25rem',
      '-1-375r': '-1.375rem',
      '-1-5r': '-1.5rem',
      '1-5r': '1.5rem',
      '-1-625r': '-1.625rem',
      '-1-75r': '-1.75rem',
      '1-75r': '1.75rem',
      '-2r': '-2rem',
      '-2-25r': '-2.25rem',
      '2r': '2rem',
      '4r': '4rem',
      '5r': '5rem',
      '7-5r': '7.5rem',
      // auto: 'auto',
      // '50p': '50%',
      '5p': '5%',
      '-10p': '-10%',
      '-12p': '-12%',
      '14p': '14%',
      '19p': '19%',
    },
    spacing: {
      grid: {
        'grid-default': '0.25rem',  // 4px
        'grid-xxs': '0.5rem',       // 8px
        'grid-xs': '0.9375rem',     // 15px
        'grid-sm': '1.25rem',       // 20px
        'grid-md': '1.875rem',      // 30px
        'grid-lg': '2.25rem',       // 36px
        'grid-xl': '3.125rem',      // 50px
        'grid-2xl': '4.125rem',     // 66px
        'grid-3xl': '5rem',         // 80px
        'grid-4xl': '6.25rem',      // 100px
        'grid-5xl': '6.625rem'      // 106px
      },
      // text variable spacing
      text: {
        'text-xs': '0.4em',
        'text-sm': '1em',
        'text-md': '1.25em',
        'text-lg': '1.625em',
        // 'text-xl': '2.5em'
      }
    },
    padding: theme => ({
      ...theme('spacing.grid'),
      ...theme('spacing.text'),
      '0': '0',
      'px': '1px',
      '2px': '2px',
      '0-5r': '0.5rem',
      '0-75r': '0.75rem',
      '1r': '1rem',
      '1-25r': '1.25rem',
      '1-5r': '1.5rem',
      '1-75r': '1.75rem',
      '1-875r': '1.875rem',
      '2r': '2rem',
      '2-25r': '2.25rem',
      '2-5r': '2.5rem',
      '3r': '3rem',
      '3-375r': '3.375rem',
      '3-75r': '3.75rem',
      '4r': '4rem',
      '4-375r': '4.375rem',
      '5r': '5rem',
      '5-5r': '5.5rem',
      '6-25r': '6.25rem',
      '7-25r': '7.25rem',
      '8-25r': '8.25rem',
      '9r': '9rem',
      '10r': '10rem'
    }),
    margin: (theme, { negative }) => ({
      ...negative(theme('spacing.grid')),
      ...theme('spacing.text'),
      auto: 'auto',

      '-px': '-1px',
      '-3px': '-3px',

      '0-5r': '0.5rem',
      '0-625r': '0.625rem',
      '0-75r': '0.75rem',
      '1r': '1rem',
      '1-25r': '1.25rem',
      '1-5r': '1.5rem',
      '1-75r': '1.75rem',
      '2r': '2rem',
      '2-25r': '2.25rem',
      '2-5r': '2.5rem',
      '2-75r': '2.75rem',
      '3r': '3rem',
      '3-125r': '3.125rem',
      '3-75r': '3.75rem',
      '-3-75r': '-3.75rem',
      '4-75r': '4.75rem',
      '-4-75r': '-4.75rem',
      '-5-25r': '-5.25rem',
      '6-25r': '6.25rem',
      '7-25r': '7.25rem',
      '9r': '9rem',
      '-9r': '-9rem',
      '9-375r': '9.375rem'
    }),
    // ----- BORDER RADIUS -----
    borderRadius: {
      'default': '1px',
      '2': '2px'
    },
    // // ----- VIEWPORT -----
    screens: {
      // a: '320px',
      b: '480px',
      c: '560px',
      'c-max': { max: '559px' },
      // d: '640px',
      e: '768px',
      'e-max': { max: '767px'},
      f: '880px',
      'f-max': { max: '879px' },
      g: '1025px',
      'g-max': { max: '1024px' },
      // h: '1100px',
      i: '1280px'
    },
    // // ----- FONTS -----
    fontFamily: {
      primary: [ 'SofiaPro', 'sans-serif' ]
    },
    fontSize: {
      omi: '0.5rem',
      xi: '0.75rem',        // 12px
      nu: '0.8125rem',      // 13px
      mu: '0.875rem',       // 14px
      lambda: '0.9375rem',  // 15px
      base: '1rem',         // 16px
      kappa: '1.0625rem',   // 17px
      iota: '1.125rem',     // 18px
      theta: '1.1875rem',   // 19px
      eta: '1.25rem',       // 20px
      zeta: '1.375rem',     // 22px
      epsilon: '1.5rem',    // 24px
      delta: '1.8125rem',   // 29px
      gamma: '2.125rem',    // 34px
      beta: '2.5625rem',    // 41px
      alpha: '3.0625rem',    // 49px

      'circle-3xs': '5.5rem',
      'circle-2xs': '6.25rem',
      'circle-xs': '7.25rem',
      'circle-sm': '9.75rem',
      'circle-md': '14.25rem',
      'circle-lg': '16rem',
      'circle-xl': '22.75rem',
      'circle-2xl': '28rem'
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      bold: '700',
    },
    lineHeight: {
      none: '1',
      tight: '1.22',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.6',
      loose: '2',
    },
    // ----- HEIGHT -----
    height: {
      '0': '0',
      '1-75r': '1.75rem',
      '2r': '2rem',
      '3r': '3rem',
      '3-5r': '3.5rem',
      '43px': '43px',
      '60px': '60px',
    },
    // minHeight: {
    //   '0': '0',
    //   full: '100%',
    //   screen: '100vh',
    // },
    // maxHeight: {
    //   full: '100%',
    //   screen: '100vh',
    // },
    // ----- WIDTH -----
    width: theme => ({
      auto: 'auto',
      // 12 grid
      '1/12': '8.33333%',
      '2/12': '16.66667%',
      '3/12': '25%',
      '4/12': '33.33333%',
      '5/12': '41.66667%',
      '6/12': '50%',
      '7/12': '58.33333%',
      '8/12': '66.66667%',
      '9/12': '75%',
      '10/12': '83.33333%',
      '11/12': '91.66667%',
      '12/12': '100%',
      // 5 grid
      '1/5': '20%',
      '2/5': '40%',
      '3/5': '60%',
      '4/5': '80%',
      // 25 grid
      '12/25': '48%',
      '13/25': '52%',
      screen: '100vw',
      '1-75r': '1.75rem',
      '2r': '2rem',
      '3-5r': '3.5rem',
      '12-5r': '12.5rem',
    }),
    maxWidth: {
      '50': '50px',
      '70': '70px',
      mu: '15.625rem',
      lambda: '24.25rem',
      iota: '31rem',
      theta: '36rem',
      zeta: '41.25rem',
      zeteps: '51.5rem',
      epsilon: '52.75rem',
      deleps: '57.5rem',
      delta: '64rem',
      gamma: '81rem',
      beta: '83rem',
      alpha: '90rem',

      'text-iota': '22em',

      full: '100%'
    },
    minWidth: {
      '11r': '11rem',
      '700': '700px'
    },
    zIndex: {
      '-1': '-1',
      '1': '1',
      '2': '2',
    }
    // opacity: {
    //   '0': '0'
    // },
    // flex: {
    //   '1': '1 1 0%',
    //   auto: '1 1 auto',
    //   initial: '0 1 auto',
    //   none: 'none',
    // },
  },
  variants: {
    width: ['responsive'],
  },
  corePlugins: {
    container: false,
  },
  plugins: []
}
