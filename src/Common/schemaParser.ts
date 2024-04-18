export interface SingleKeySchema {
  parent?: string;
  prop: string;
  type: string;
  oneOf?: string[];
  required?: boolean;
  parse?: (value: any) => any;
}

export interface SchemaType {
  [key: string]: SingleKeySchema;
}

export interface DataWithError {
  [key: string]: {
    value: any;
    error?: string;
  };
}

export interface ParsedData {
  [key: string]: any;
}

export interface ErrorData {
  index: number;
  key: string;
  error: string;
}

interface parseDataProps {
  dataWithErrors: DataWithError[];
  parsedData: ParsedData[];
  errors: ErrorData[];
}

const validateAndParse = (
  key: string,
  value: any,
  schema: SingleKeySchema,
): { [key: string]: { value: any; error?: string } } => {
  try {
    const parsedValue = schema?.parse?.(value) ?? value;
    const expectedType = schema?.type;

    if (
      (parsedValue === undefined || parsedValue === null) &&
      !schema?.required
    ) {
      return { [key]: { value: parsedValue } };
    }

    if (typeof parsedValue !== expectedType && expectedType !== "any") {
      return {
        [key]: {
          value: parsedValue,
          error: `${key} should be of type ${expectedType}`,
        },
      };
    }

    if (schema?.oneOf && !schema?.oneOf.includes(parsedValue)) {
      return {
        [key]: {
          value: parsedValue,
          error: `${key} should be one of the ${schema?.oneOf}`,
        },
      };
    }

    if (
      schema?.required &&
      (parsedValue === undefined || parsedValue === null)
    ) {
      return {
        [key]: { value: parsedValue, error: `${key} is required` },
      };
    }

    return { [key]: { value: parsedValue } };
  } catch (error: any) {
    return { [key]: { value, error: error.message } };
  }
};

const parseDataWithSchema = (
  data: any[],
  schema: SchemaType,
): parseDataProps => {
  const errors: ErrorData[] = [];
  const parsedData: ParsedData[] = [];
  const dataWithErrors: DataWithError[] = data.map((item, index) => {
    return Object.keys(schema).reduce((acc, key) => {
      const {
        [key]: { value, error },
      } = validateAndParse(key, item[key], schema[key]);
      const parsedRow = { [schema[key].prop]: value };
      if (error) {
        errors.push({ index, key, error });
      }
      const prop = schema[key].prop || key;

      if (schema[key].parent) {
        const indexKey = schema[key].parent || key;
        acc[indexKey] = acc[indexKey] || {};
        acc[indexKey][prop] = { value, error };

        if (!parsedData[index]) {
          parsedData[index] = {};
        }

        parsedData[index][indexKey] = {
          ...(parsedData[index][indexKey] || {}),
          [prop]: value,
        };
      } else {
        acc[prop] = { value, error };

        if (!parsedData[index]) {
          parsedData[index] = {};
        }

        parsedData[index] = { ...parsedData[index], ...parsedRow };
      }

      return acc;
    }, {} as ParsedData);
  });

  return { dataWithErrors, parsedData, errors };
};
/**
 * This function takes in an array of JSON data and a schema and returns the parsed data and the data with errors
 * @param dataArray The array of JSON data to be parsed
 * @param schema The schema to validate and parse the data against
 * @returns An object containing the parsed data, data with errors, and data without errors
 * @example
 * const data = [
 *  { name: "Ram", age: 25 },
 *  { name: "Raj", age: "30" },
 *  { name: "Sam", age: 35 },
 * ];
 *
 * const schema = {
 *  name: { prop: "name", type: "string", required: true },
 *  age: { prop: "age", type: "number", required: true , parse: (value) => {
 *    if(value < 0 || value > 100) throw new Error("age should be between 0 and 100");
 *    return value;
 * },
 * };
 *
 * const { dataWithErrors, parsedData, ParsedDataWithOutErrors, errors } = schemaParser(data, schema);
 *
 * dataWithErrors => [
 * { name: { value: "Ram" }, age: { value: 25 } },
 * { name: { value: "Raj" }, age: { value: "30", error: "age should be of type number" } },
 * { name: { value: "Sam" }, age: { value: 35 } },
 * ]
 *
 * parsedData => [
 * { name: "Ram", age: 25 },
 * { name: "Raj", age: "30" },
 * { name: "Sam", age: 35 },
 * ]
 *
 * ParsedDataWithOutErrors => [
 * { name: "Ram", age: 25 },
 * { name: "Sam", age: 35 },
 * ]
 *
 * errors => [
 * { index: 1, key: "age", error: "age should be of type number" }
 * ]
 *
 */
const schemaParser = (
  dataArray: any[],
  schema: SchemaType,
): parseDataProps & { ParsedDataWithOutErrors: ParsedData[] } => {
  const { dataWithErrors, parsedData, errors } = parseDataWithSchema(
    dataArray,
    schema,
  );

  const ParsedDataWithOutErrors = parsedData.filter((item, index) => {
    return !Object.values(dataWithErrors[index]).some((item) => item.error);
  });

  return {
    dataWithErrors,
    parsedData,
    ParsedDataWithOutErrors,
    errors,
  };
};

export default schemaParser;
