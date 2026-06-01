# ---- build ----
FROM node:22-alpine AS builder
WORKDIR /app

# Enable corepack for proper pnpm version
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
# Optimize pnpm installation using Docker build cache
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# ---- runtime ----
FROM node:22-alpine AS runner
WORKDIR /app

# Set ownership of workspace for security
RUN chown node:node /app

# Copy the built output from builder, setting ownership to non-root user
COPY --from=builder --chown=node:node /app/.output ./.output
COPY --from=builder --chown=node:node /app/drizzle ./drizzle

# Run as non-root user for security (OWASP)
USER node

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
