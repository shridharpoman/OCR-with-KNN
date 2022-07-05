import { MongoClient } from 'mongodb';

import { ok, err } from 'cs544-js-utils';

import { b64ToUint8Array, uint8ArrayToB64 } from './uint8array-b64.mjs';

export default async function makeFeaturesDao(dbUrl) {
  return FeaturesDao.make(dbUrl);
}

class FeaturesDao {
  constructor(params) { Object.assign(this, params); }

  static async make(dbUrl) {
    const params = {};
    try {
      params._client = new MongoClient(dbUrl);
      await params._client.connect();
      const db = params._client.db();
      const features = db.collection(FEATURES_COLLECTION)
      params.features = features;
      // await features.createIndex('featureId');
      params.count = await features.countDocuments();
      return ok(new FeaturesDao(params));

    }
    catch (error) {
      return err(error.message, { code: 'DB' });
    }
  }

  /** close off this DAO; implementing object is invalid after 
 *  call to close() 
 *
 *  Error Codes: 
 *    DB: a database error was encountered.
 */
  async close() {
    try {
      await this._client.close();
    }
    catch (e) {
      err(e.message, { code: 'DB' });
    }
  }

  /** retrieve id.
 *
 *  Error codes:
 *    NOT_FOUND: no user found for userId
 *    DB: a database error.
 */
  async get(featureId, bol) {
    try {
      const collection = this.features;
      const dbEntry = await collection.findOne({ _id: featureId });
      if (dbEntry) {

        const feature = { ...dbEntry };
        delete feature._id;
        const { features, label, isTrain } = feature;
        const featureArr = b64ToUint8Array(features);
        if (bol === true) {
          const result = { id: featureId, features, label, isTrain };
          return ok(result);
        }
        else {
          const result = { id: featureId, features: featureArr, label, isTrain };
          return ok(result);
        }
      }
      else {
        return err(`no feature for id '${featureId}'`, { code: 'NOT_FOUND' });
      }
    }
    catch (e) {
      return err(e.message, { code: 'DB' });
    }
  }

  /** add user.
   *  Error Codes: 
   *    EXISTS: user with specific loginId already exists
   *    DB: a database error was encountered.
   */
  async add(featureArr, b64, lab) {
    let featureArray = featureArr
    let label = lab
    let features
    if (featureArr instanceof (Uint8Array)) {

      features = uint8ArrayToB64(featureArray);
    }
    else {
      features = featureArr
    }


    const Id = uid();
    const dbObj = { _id: Id, id: Id, features, isTrain: label ? true : false, label };
    try {
      const collection = this.features;
      await collection.insertOne(dbObj);
    }
    catch (e) {
      return err(e.message, { code: 'DB' });
    }
    return ok(JSON.stringify(dbObj));
  }


  /** clear all data in this DAO.
   *
   *  Error Codes: 
   *    DB: a database error was encountered.
   */

  async clear() {
    try {
      await this.features.deleteMany({});
      return ok();
    }
    catch (e) {
      return err(e.message, { code: 'DB' });
    }
  }
  // return all records with isTrain true in Uint8Array's.
  async getAllTrainingFeatures() {
    try {
      const collection = this.features;
      const dbEntry = await collection.find({ isTrain: true }).toArray();
      if (dbEntry) {
        const result = dbEntry.map(e => {
          const { features, label, isTrain } = e;
          const featureArr = b64ToUint8Array(features);
          return { id: e._id, features: featureArr, label, isTrain };
        }
        );
        return ok(result);
      }
      else {
        return err(`no feature for id '${featureId}'`, { code: 'NOT_FOUND' });
      }
    }
    catch (e) {
      return err(e.message, { code: 'DB' });
    }
  }
}




const uid = function () {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

const FEATURES_COLLECTION = 'feat';

const NEXT_ID_KEY = 'count';
const RAND_LEN = 2;


