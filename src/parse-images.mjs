import { ok, err } from 'cs544-js-utils';

/** parse byte streams in imageBytes: { images: Uint8Array, labels:
 *  Uint8Array } as per imageSpecs { images: HeaderSpec[], labels:
 *  HeaderSpec[] } to return a list of LabeledFeatures (wrapped within
 *  a Result).
 *
 *  Errors:
 *    BAD_VAL: value in byte stream does not match value specified
 *             in spec.
 *    BAD_FMT: size of bytes stream inconsistent with headers
 *             or # of images not equal to # of labels.
 */
export default function parseImages(imageSpecs, imageBytes) {


  var data = new Uint8Array(imageBytes.images);
  var dataView = new DataView(data.buffer);
  var count = dataView.getInt32(4, false);


  let n_rows = imageSpecs.images[2].value;
  let n_cols = imageSpecs.images[3].value;

  var pixelValues = [];

  for (var image = 0; image <= count - 1; image++) {
    var pixels = [];

    for (var y = 0; y <= (n_cols - 1); y++) {
      for (var x = 0; x <= (n_rows - 1); x++) {
        pixels.push(imageBytes.images[(image * n_rows * n_rows) + (x + (y * n_rows)) + 16]);
      }
    }

    var imageData = {};
    // var label = imageBytes.labels[image + 8];
    imageData["features"] = new Uint8Array(pixels);
    imageData["label"] = JSON.stringify(imageBytes.labels[image + 8]);

    pixelValues.push(imageData);
  }

  const Result = { val: pixelValues };

  return Result;
}

