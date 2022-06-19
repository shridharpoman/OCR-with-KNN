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

  // console.log(imageSpecs)
  // console.log("magic", imageSpecs.images[0].value)
  const image_data = new Uint8Array(imageBytes.images);
  const labelData = new Uint8Array(imageBytes.labels);
  const imageDataView = new DataView(image_data.buffer);
  const labelDataView = new DataView(labelData.buffer);
  const magicNumberImage = imageDataView.getInt32(0, false);
  const magicNumberLabel = labelDataView.getInt32(0, false);
  const nRowsImage = imageBytes.images[11];
  const nColsImage = imageBytes.images[15];
  const n_rows_actual = imageSpecs.images[2].value;
  const n_cols_actual = imageSpecs.images[3].value;
  const imageCount = imageDataView.getInt32(4, false);
  const labelCount = labelDataView.getInt32(4, false);

  const imageCalculated = (imageBytes.images.length - 16) / (n_rows_actual * n_cols_actual);
  const labelCalculated = imageBytes.labels.length - 8;

  // console.log(nRowsImage, imageSpecs.images[2].value)

  if (imageCount !== imageCalculated) {
    return err('here is an error1', { code: 'BAD_FMT' });
  }

  if (magicNumberImage !== imageSpecs.images[0].value
    || magicNumberLabel !== imageSpecs.labels[0].value
  ) {
    return err('here is an error3', { code: 'BAD_VAL' });
  }

  if (n_rows_actual !== nRowsImage) {
    return err('here is an error4', { code: 'BAD_VAL' });
  }

  if (n_cols_actual !== nColsImage) {
    return err('here is an error5', { code: 'BAD_VAL' });
  }

  if (labelCount !== labelCalculated) {
    return err('here is an error6', { code: 'BAD_FMT' });

  }

  if (imageCalculated !== labelCalculated) {
    return err('here is an error', { code: 'BAD_FMT' });

  }


  var pixelValues = [];

  for (var image = 0; image <= imageCount - 1; image++) {
    var pixels = [];

    for (var y = 0; y <= (nColsImage - 1); y++) {
      for (var x = 0; x <= (nRowsImage - 1); x++) {
        pixels.push(imageBytes.images[(image * nRowsImage * nRowsImage) + (x + (y * nRowsImage)) + 16]);
      }
    }

    var imageData = {};
    var label = imageBytes.labels[image + 8];
    imageData["label"] = JSON.stringify(label);
    imageData["features"] = pixels;
    // imageData[ JSON.stringify( label ) ] = pixels;

    pixelValues.push(imageData);

  }

  return { val: pixelValues, hasErrors: false };

  // return err('parseImages() not implemented', { code: 'NO_IMPL' });
}