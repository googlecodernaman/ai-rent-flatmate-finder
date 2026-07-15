/**
 * Zod request validation middleware factory.
 * Usage: validate(schema) — validates req.body against the Zod schema.
 * On failure, throws a ZodError that the global errorHandler formats as 400.
 *
 * For query param validation: validate(schema, 'query')
 * For param validation: validate(schema, 'params')
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const data = schema.parse(req[source]);
      // Replace the raw input with the parsed (and coerced) data
      req[source] = data;
      next();
    } catch (err) {
      next(err); // ZodError → errorHandler → 400
    }
  };
}

module.exports = { validate };
