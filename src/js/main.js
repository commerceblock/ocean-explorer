import 'svgxuse';

(() => {
  const header = document.querySelector('.header');
  const dy = 5;
  let y0 = 0;

  window.addEventListener('scroll', handleScroll, false);

  function handleScroll() {
    const y = window.scrollY || document.documentElement.scrollTop;

    if (Math.abs(y0 - y) <= dy) return;

    if (y > 80) {
      header.classList.add('header--scrolling');
    } else {
      header.classList.remove('header--scrolling');
    }
    y0 = y;
  }
})()
