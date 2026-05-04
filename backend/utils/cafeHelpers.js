function normalizeCafePayload(payload = {}, { isUpdate = false } = {}) {
  const normalized = {};
  const stringFields = ["id", "name", "area", "city", "image", "description"];
  const booleanFields = ["wifi", "powerSockets", "openNow"];
  const numberFields = ["rating", "priceLevel"];

  for (const field of stringFields) {
    if (payload[field] !== undefined) {
      normalized[field] = String(payload[field]).trim();
    }
  }

  for (const field of booleanFields) {
    if (payload[field] !== undefined) {
      normalized[field] = Boolean(payload[field]);
    }
  }

  for (const field of numberFields) {
    if (payload[field] !== undefined) {
      normalized[field] = Number(payload[field]);
    }
  }

  if (payload.tags !== undefined) {
    normalized.tags = Array.isArray(payload.tags)
      ? payload.tags.map((tag) => String(tag).trim()).filter(Boolean)
      : [];
  }

  if (payload.location !== undefined) {
    normalized.location = {
      lat:
        payload.location?.lat !== undefined && payload.location?.lat !== null
          ? Number(payload.location.lat)
          : null,
      lng:
        payload.location?.lng !== undefined && payload.location?.lng !== null
          ? Number(payload.location.lng)
          : null,
    };
  }

  if (payload.googleMetadata !== undefined) {
    normalized.googleMetadata = payload.googleMetadata;
  }

  if (payload.googlePlaceId !== undefined) {
    normalized.googlePlaceId = payload.googlePlaceId;
  }

  if (payload.source !== undefined) {
    normalized.source = payload.source;
  }

  if (isUpdate) {
    Object.keys(normalized).forEach((key) => {
      if (normalized[key] === "") {
        delete normalized[key];
      }
    });
  }

  return normalized;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseAddressParts(formattedAddress = "") {
  const parts = formattedAddress
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    area: parts[0] || "Unknown area",
    city:
      parts.length >= 3
        ? parts[1]
        : parts.length > 1
          ? parts[parts.length - 1]
          : parts[0] || "Unknown city",
  };
}

module.exports = {
  normalizeCafePayload,
  slugify,
  parseAddressParts,
};
