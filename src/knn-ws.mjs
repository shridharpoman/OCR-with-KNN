import cors from 'cors';
import express from 'express';
import bodyparser from 'body-parser';
import assert from 'assert';
import STATUS from 'http-status';

import { ok, err } from 'cs544-js-utils';
import { knn } from 'prj1-sol';
import { uint8ArrayToB64, b64ToUint8Array } from 'prj2-sol';

import fs from 'fs';
import http from 'http';
import https from 'https';

export const DEFAULT_COUNT = 5;

/** Start KNN server.  If trainData is specified, then clear dao and load
 *  into db before starting server.  Return created express app
 *  (wrapped within a Result).
 *  Types described in knn-ws.d.ts
 */
export default async function serve(knnConfig, dao, data) {
  try {
    const app = express();
    app.locals = {
      base: knnConfig.base,
      k: knnConfig.k,
      dao,
      data,
    };


    if (data) {
      await dao.clear();
      for (const { features, label } of data) {
        await dao.add(new Uint8Array(features), false, label);
      }
    }
    setupRoutes(app);


    return ok(app);
  }
  catch (e) {
    return err(e.toString(), { code: 'INTERNAL' });
  }
}


function setupRoutes(app) {
  const base = app.locals.base;
  app.use(cors({ exposedHeaders: 'Location' }));
  app.use(express.json({ strict: false })); //false to allow string body
  app.post(`${base}/images`, doPostImage(app));
  app.get(`${base}/images/:imageId`, doGetImages(app));
  app.get(`${base}/labels/:imageId/:k?`, doClassify(app));
  app.get(`${base}/clear`, doClear(app));
  //app.use(express.text());
  app.get(`${base}`, dummyHandler(app));
  //uncomment to log requested URLs on server stderr
  // app.use(doLogRequest(app));

  //TODO: add knn routes here

  //must be last
  app.use(do404(app));
  app.use(doErrors(app));
}

//The request body must be a JSON string containing a base-64 test image; i.e. the base-64 encoding must be surrounded within double quotes. This image should be stored in the database and an ID identifying the image should be returned as the id property of the JSON response.
function doPostImage(app) {
  return async (req, res) => {

    const base = app.locals.base;
    const dao = app.locals.dao;
    try {
      const imageB64 = req.body;

      const imageBytes = b64ToUint8Array(imageB64);
      const id = await dao.add(imageBytes, false);
      const location = `${base}/images/${id.val}`;
      res.setHeader('Location', location);
      res.status(STATUS.OK).json({ id: id.val });

    }
    catch (e) {
      const mapped = mapResultErrors(e);
      res.status(mapped.status).json(mapped);
    }
  }
}

/* Retrieves the image specified by IMAGE_ID from the underlying database. Return a JSON response having the following two properties:

features
A base-64 representation of the retrieved image bytes.

label
The label associated with the image (if any).

Return a 404 NOT_FOUND response if the image specified by IMAGE_ID does not exist. \

*/

function doGetImages(app) {
  return async (req, res) => {
    // console.log(req.params.imageId)
    const base = app.locals.base;
    const dao = app.locals.dao;
    const imageId = req.params.imageId;
    // console.log(imageId);
    try {
      const result = await dao.get(imageId);
      // console.log(image)
      if (result.hasErrors) {
        res.status(STATUS.NOT_FOUND).json(result);
        return;
      }
      const imageB64 = uint8ArrayToB64(result.val.features);
      // console.log(imageB64);
      res.status(STATUS.OK).json({ features: imageB64, label: result.val.label });
    }
    catch (e) {
      const mapped = mapResultErrors(e);
      res.status(mapped.status).json(mapped);
    }
  }
}

function doClear(app) {
  return async function (req, res) {
    const dao = app.locals.dao;
    try {
      await dao.clear();
      res.status(STATUS.OK).json({});
    }
    catch (e) {
      const mapped = mapResultErrors(e);
      res.status(mapped.status).json(mapped);
    }
  }
}

/*

  must correctly classify tests despite two incorrectly labeled images when k == 5:

 */

function doClassify(app) {
  return async (req, res) => {
    const base = app.locals.base;
    const dao = app.locals.dao;
    const imageId = req.params.imageId;
    const k = req.params.k;
    try {
      const result = await dao.get(imageId);
      const resultBuff = Buffer.from(result.val.features);
      if (result.hasErrors) {
        res.status(STATUS.NOT_FOUND).json(result);
        return;
      }
      const trainResult = await dao.getAllTrainingFeatures();


      if (trainResult.hasErrors) {
        res.status(STATUS.NOT_FOUND).json(trainResult);
        return;
      }

      const trainData = trainResult.val.map(x => {
        if (x.features.length !== result.val.features.length) {
          // get?.body?.errors?.[0]?.options?.code equals 'BAD_FMT'
          res.status(STATUS.BAD_REQUEST).json({ errors: [{ options: { code: 'BAD_FMT' } }] });
          return;
        }
        return {
          features: Buffer.from(x.features),
          label: x.label,
        }
      }
      );


      // // delete elements with null
      // trainData.splice(0, trainData.length, ...trainData.filter(x => x !== null));


      const knnResult = knn(resultBuff, trainData, k);
      const knnId = trainResult.val[knnResult.val[1]];
      const knnLabel = knnResult.val[0];
      res.status(STATUS.OK).json({ id: knnId.id, label: knnLabel });
    }
    catch (e) {
      const mapped = mapResultErrors(e);
      res.status(mapped.status).json(mapped);
    }
  }
}







//dummy handler to test initial routing and to use as a template
//for real handlers.  Remove on project completion.
function dummyHandler(app) {
  return (async function (req, res) {
    try {
      res.json({ status: 'TODO' });
    }
    catch (err) {
      const mapped = mapResultErrors(err);
      res.status(mapped.status).json(mapped);
    }
  });
}

//TODO: add real handlers


/** Handler to log current request URL on stderr and transfer control
 *  to next handler in handler chain.
 */
function doLogRequest(app) {
  return (function (req, res, next) {
    console.error(`${req.method} ${req.originalUrl}`);
    next();
  });
}

/** Default handler for when there is no route for a particular method
 *  and path.
 */
function do404(app) {
  return async function (req, res) {
    const message = `${req.method} not supported for ${req.originalUrl}`;
    const result = {
      status: STATUS.NOT_FOUND,
      errors: [{ options: { code: 'NOT_FOUND' }, message, },],
    };
    res.status(404).json(result);
  };
}


/** Ensures a server error results in nice JSON sent back to client
 *  with details logged on console.
 */
function doErrors(app) {
  return async function (err, req, res, next) {
    const message = err.message ?? err.toString();
    const result = {
      status: STATUS.INTERNAL_SERVER_ERROR,
      errors: [{ options: { code: 'INTERNAL' }, message }],
    };
    res.status(STATUS.INTERNAL_SERVER_ERROR).json(result);
    console.error(result.errors);
  };
}

/*************************** Mapping Errors ****************************/

//map from domain errors to HTTP status codes.  If not mentioned in
//this map, an unknown error will have HTTP status BAD_REQUEST.
const ERROR_MAP = {
  EXISTS: STATUS.CONFLICT,
  NOT_FOUND: STATUS.NOT_FOUND,
  AUTH: STATUS.UNAUTHORIZED,
  DB: STATUS.INTERNAL_SERVER_ERROR,
  INTERNAL: STATUS.INTERNAL_SERVER_ERROR,
}

/** Return first status corresponding to first options.code in
 *  errors, but SERVER_ERROR dominates other statuses.  Returns
 *  BAD_REQUEST if no code found.
 */
function getHttpStatus(errors) {
  let status = null;
  for (const err of errors) {
    const errStatus = ERROR_MAP[err.options?.code];
    if (!status) status = errStatus;
    if (errStatus === STATUS.SERVER_ERROR) status = errStatus;
  }
  return status ?? STATUS.BAD_REQUEST;
}

/** Map domain/internal errors into suitable HTTP errors.  Return'd
 *  object will have a "status" property corresponding to HTTP status
 *  code.
 */
function mapResultErrors(err) {
  const errors = err.errors ?? [{ message: err.message ?? err.toString() }];
  const status = getHttpStatus(errors);
  if (status === STATUS.INTERNAL_SERVER_ERROR) console.error(errors);
  return { status, errors, };
}