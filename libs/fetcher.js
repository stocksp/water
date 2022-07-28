import converter from 'libs/convertToPower'

const fetcher = (url) =>
  fetch(url).then((r) =>
    r.json().then(converter)
  );

export default fetcher;
