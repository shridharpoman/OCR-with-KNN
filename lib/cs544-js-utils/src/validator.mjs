import { ok, err } from './errors.mjs';

export default function makeValidator(validationSpecs) {
  return new Validator(validationSpecs);
}

class Validator {

  constructor(specs) {
    this._specs = specs;
  }

  validate(cmd, obj={}) {
    const spec = this._specs[cmd];
    if (!spec) {
      return err(`unknown command ${cmd}`, { code: 'BAD_REQ' });
    }
    else {
      return validate(cmd, spec, obj);
    }
  }
  
}

function validate(cmd, spec, obj) {
  const { fields } =  spec; 
  if (!fields) {
    const message = 'missing "fields" property in spec';
    return err(message, { code: 'INTERNAL' });
  }
  const result = { ...obj };
  const errors = [];
  for (const [id, spec] of Object.entries(fields)) {
    let val = obj[id] ?? undefined;
    let valIsErr = false;
    if (val === undefined) {
      if (spec.required) {
	errors.push(valueError(val, spec?.name ?? id, id));
	valIsErr = true;
      }
      else if (spec.default !== undefined) {
	val = spec.default;
      }
    }
    if (val !== undefined && !valIsErr) {
      const idVal = checkField(val.toString(), spec, id, obj, errors);
      if (idVal !== undefined) result[id] = idVal;
    }
  }
  if (errors.length > 0) {
    const errResult = err(...errors[0]);
    for (let i = 1; i < errors.length; i++) errResult.addError(...errors[i]);
    return errResult;
  }
  else {
    return ok(result);
  }
}

function checkField(fieldVal, fieldSpec, id, topVal, errors) {
  if (fieldSpec?.chk) {
    if (fieldSpec.chk.constructor === RegExp) {
      const m = fieldVal.match(fieldSpec.chk);
      if (!m || m.index !== 0 || m[0].length !== fieldVal.length) {
	errors.push(valueError(fieldVal, fieldSpec.name ?? id, id));
	return undefined;
      }
    }
    else if (Array.isArray(fieldSpec.chk)) { 
      if (fieldSpec.chk.indexOf(fieldVal) < 0) {
	errors.push(valueError(fieldVal, fieldSpec.name ?? id, id));
	return undefined;
      }
    }
    else if (typeof fieldSpec.chk === 'function') {
      const msg = fieldSpec.chk.call(topVal, fieldVal, fieldSpec, id);
      if (msg) {
	errors.push([msg, { code: 'BAD_VAL', widget: id }]);
	return undefined;
      }
    }
    else {
      const msg = `bad field chk for field "${id}"`;
      errors.push([msg, { code: 'INTERNAL', widget: id }]);
      return undefined;
    }
  }
  else if (!SAFE_CHARS_REGEX.test(fieldVal)) {
    errors.push(valueError(fieldVal, fieldSpec?.name ?? id, id));
    return undefined;
  }
  const val = (fieldSpec?.valFn)
	      ? fieldSpec.valFn.call(topVal, fieldVal, fieldSpec, id)
              : fieldVal;
  return val;
}


function valueError(val, name, id) {
  const message = (val !== undefined)
	          ? `bad value "${val}" for ${name}`
           	  : `missing value for ${name}`;
  const code = (val !== undefined) ? 'BAD_VAL' : 'BAD_REQ';
  return [ message, { code, widget: id } ];
}

function valStr(val) { return (val ?? '').toString().trim(); }
    
const SAFE_CHARS_REGEX = /^[\w\s\-\.\@\#\%\$\^\*\(\)\{\}\[\]\:\,\/\'\"\!]*$/;

