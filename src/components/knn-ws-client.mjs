import { ok, err } from 'cs544-js-utils';

export default function makeKnnWsClient(wsUrl) {
  return new KnnWsClient(wsUrl);
}

class KnnWsClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
  }

  /** Given a base64 encoding b64Img of an MNIST compatible test
   *  image, use The fetch()     fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    }) 

    
    
    to return a Result containing at least
   *  the following properties:
   *
   *   `label`: the classification of the image.
   *   `id`: the ID of the training image "closest" to the test
   *         image.
   * 
   *  If an error is encountered then return an appropriate
   *  error Result.
   *  Set up all the code within atry-catch block
   */
  async classify(b64Img) {
    // console.log(b64Img);
    try {
      const url = this.wsUrl + '/knn/images';
      const data = {
        image: b64Img
      };
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data.image)
      });
      const jsonRes = await response.json();
      if (jsonRes.errors) {
        return err(jsonRes.errors[0].message);
      }
      return ok(jsonRes);
    }
    catch (errr) {
      return err(errr);
    }
  }

  /** Return a Result containing the base-64 representation of
   *  the image specified by imageId.  Specifically, the success
   *  return should be an object containing at least the following
   *  properties:
   *
   *   `features`:
   *     A base-64 representation of the retrieved image bytes.
   *   `label`:
   *     The label associated with the image (if any).
   *
   *  If an error is encountered then return an appropriate
   *  error Result.
   */
  async getImage(imageId) {
    try {
      const url = this.wsUrl + '/knn/labels/' + imageId;
      const response = await fetch(url);
      const jsonRes = await response.json();
      if (jsonRes.errors) {
        return err(jsonRes.errors[0].message);
      }
      return ok(jsonRes);
    }
    catch (err) {
      return err(err);
    }

  }

  /** convert an erroneous JSON web service response to an error Result. */
  wsError(jsonRes) {
    return err(jsonRes.errors[0].message, jsonRes.errors[0].options);
  }

}
