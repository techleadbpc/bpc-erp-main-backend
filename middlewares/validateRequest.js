const validateRequest =
  (schema, source = "body") =>
  (req, res, next) => {
    const dataToValidate = req[source];

    const { error } = schema.validate(dataToValidate, {
      convert: true,
      abortEarly: false,
    });

    if (error) {
      const e = new Error();
      e.name = "Validation Error";
      e.message = error.details?.map((detail) => detail.message).join("\n");
      throw e;
    }

    next();
  };

module.exports = validateRequest;
