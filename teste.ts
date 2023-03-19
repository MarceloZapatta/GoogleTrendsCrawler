import slugify from "slugify";

const title = slugify('Marcelo Surpreende ao revelar', {
  remove: /[^A-Za-z0-9\ ]/g,
  lower: true
});

console.log(title);

