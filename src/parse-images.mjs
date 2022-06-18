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


  const magic_number0 = imageBytes.images[2];
  const magic_number1 = imageBytes.images[3];

  const magic_number_cal = magic_number0 * 16 * 16 + magic_number1;
  // console.log(magic_number_cal)
  const magic_number_actual = imageSpecs.images[0].value;

  const magic_number_labels0 = imageSpecs.labels[2];
  const magic_number_labels1 = imageBytes.labels[3];

  const magic_number_labels_cal = magic_number_labels0 * 16 * 16 + magic_number_labels1;
  const magic_number_labels_actual = imageSpecs.labels[0].value;
  const n_rows = imageBytes.images[11];
  const n_cols = imageBytes.images[15];
  const n_rows_actual = imageSpecs.images[2].value;
  const n_cols_actual = imageSpecs.images[3].value;

  const n_images_label = imageBytes.labels[7];
  const n_images = imageBytes.images[7];


  const n_images_actual = (imageBytes.images.length - 16) / (n_cols_actual * n_rows_actual);
  const n_images_label_actual = imageBytes.labels.length - 8;

  if (n_images_actual !== n_images_label_actual
    || n_images !== n_images_label
  ) {
    return err('here is an error', { code: 'BAD_FMT' });
  }
  if (n_images !== n_images_actual) {
    return err('here is an error', { code: 'BAD_FMT' });

  }

  if (magic_number_cal !== magic_number_actual
    || magic_number_labels_cal !== magic_number_labels_actual
  ) {
    return err('here is an error', { code: 'BAD_VAL' });
  }

  if (n_rows_actual !== n_rows) {
    return err('here is an error', { code: 'BAD_VAL' });
  }

  if (n_cols_actual !== n_cols) {
    return err('here is an error', { code: 'BAD_VAL' });
  }

  if (n_images_label !== n_images_label_actual) {
    return err('here is an error', { code: 'BAD_FMT' });

  }

  var pixelValues = [];

  for (var image = 0; image <= n_images - 1; image++) {
    var pixels = [];

    for (var y = 0; y <= (n_cols - 1); y++) {
      for (var x = 0; x <= (n_rows - 1); x++) {
        pixels.push(imageBytes.images[(image * n_rows * n_rows) + (x + (y * n_rows)) + 16]);
      }
    }

    var imageData = {};
    var label = imageBytes.labels[image + 8];
    imageData["label"] = JSON.stringify(label);
    imageData["features"] = pixels;
    // imageData[ JSON.stringify( label ) ] = pixels;

    pixelValues.push(imageData);
  }
  return { val: pixelValues };
}

