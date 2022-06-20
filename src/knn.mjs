import { ok, err } from 'cs544-js-utils';

/** return pair [label, index] (wrapped within a Result) of the
 *  training LabeledFeatures trainLabeledFeatures having the most
 *  common label of the k training features closest to subject
 *  testFeatures.
 *
 *  Errors:
 *    BAD_FMT: trainLabeledFeatures has features bytes with length 
 *             different from length of subject testFeatures.
 */
export default function knn(testFeatures, trainLabeledFeatures, k = 3) {
  const trainLength = trainLabeledFeatures[0].features.length;
  const testLength = testFeatures.length;
  if (trainLength !== testLength) {
    return err('here is an error1', { code: 'BAD_FMT' });
  }

  const pred = []
  let maxDistanceInPred;

  for (let index = 0, len = testFeatures.length; index < len; index++) {
    // console.log(index)
    const seconsPoint = trainLabeledFeatures[index].features
    const label = trainLabeledFeatures[index].label
    const thisDistance = distance(testFeatures, seconsPoint)
    // console.log(thisDistance)
    if (!maxDistanceInPred || thisDistance < maxDistanceInPred) {

      // Only add an item if it's closer than the farthest of the candidates
      pred.push({
        label: label,
        index,
        distance: thisDistance
      });

      // Sort the map so the closest is first
      pred.sort((a, b) => a.distance < b.distance ? -1 : 1);

      // If the map became too long, drop the farthest item
      if (pred.length > k) {
        pred.pop();
      }

      // Update this value for the next comparison
      maxDistanceInPred = pred[pred.length - 1].distance;

    }
  }
  pred.forEach(obj => {
    delete obj['distance']
  })
  const leastPred = pred[0]
  const arry = new Array(leastPred.label, leastPred.index)

  return { val: arry, hasErrors: false }
}

const distance = (a, b) => Math.sqrt(
  a.map((aPoint, i) => b[i] - aPoint)
    .reduce((sumOfSquares, diff) => sumOfSquares + (diff * diff), 0)
);