function validate(schema) {
  return (req, res, next) => {
    const options = {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true,
    };
    const { error, value } = schema.validate(
      { body: req.body, params: req.params, query: req.query },
      options
    );

    if (error) {
      return res.status(422).json({
        success: false,
        message: "Validation error",
        details: error.details.map((d) => d.message),
        cid: req.correlationId,
      });
    }

    // Assign data yang sudah bersih kembali ke req
    if (value.body) Object.assign(req.body, value.body);
    if (value.params) Object.assign(req.params, value.params);
    if (value.query) Object.assign(req.query, value.query);

    return next();
  };
}

module.exports = validate;