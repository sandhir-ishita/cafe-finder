function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function formatValidationError(err) {
  if (err?.name === "ValidationError") {
    return Object.values(err.errors)
      .map((item) => item.message)
      .join(", ");
  }

  if (err?.code === 11000) {
    return "A record with that unique value already exists.";
  }

  return err?.message || "Unknown error";
}

module.exports = {
  asyncHandler,
  formatValidationError,
};
