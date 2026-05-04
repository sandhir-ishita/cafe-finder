# ── Stage 1: Install dependencies ────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy only the manifests first to leverage Docker layer caching.
# If package.json hasn't changed, npm install is skipped on rebuild.
COPY package*.json ./
RUN npm ci --only=production

# ── Stage 2: Final image ──────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Run as a non-root user — never run Node apps as root in production.
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

# Copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Drop to non-root user
USER appuser

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "server.js"]
