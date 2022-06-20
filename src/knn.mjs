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
  // console.log(trainLabeledFeatures[0].features)
  const pred = []
  let maxDistanceInPred;
  // console.log(testFeatures.length)
  // const len = testFeatures.length
  // console.log(dist(testFeatures, trainLabeledFeatures[50].features))
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
  // console.log(arry)
  // console.log({ val: arry })
  return { val: arry }
  // console.log(trainLabeledFeatures)
  // return err('knn() not implemented', { code: 'NO_IMPL' });
}

const distance = (a, b) => Math.sqrt(
  a.map((aPoint, i) => b[i] - aPoint)
    .reduce((sumOfSquares, diff) => sumOfSquares + (diff * diff), 0)
);