# ---- Base Node ----
FROM node:20-alpine AS base
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* bun.lock* ./
# Install dependencies prioritizing npm over bun just for standard docker unless bun is preferred.
# Since bun.lock is present, we will use it if installed, but installing bun is an extra step. Let's use npm.
RUN npm install

# ---- Build ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variable specifically for Prisma logic during build
ENV DATABASE_URL="file:/app/data/sqlite.db"
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma Client & Build the app
RUN npx prisma generate
RUN npm run build

# ---- Production ----
FROM base AS runner

# We add openssl because prisma requires it for connecting to SQLite/DB depending on alpine version
RUN apk add --no-cache openssl curl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:/app/data/sqlite.db"
ENV PORT=3000

# Create the persistent data directory with proper permissions
RUN mkdir -p /app/data && chown -R node:node /app/data

# Create user group so we don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install prisma CLI for the init script
RUN npm install prisma@^5.22.0


# Copy the standalone output
COPY --from=builder /app/public ./public
# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# We also need the prisma folder for the init script to push the DB
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/init.sh ./init.sh

RUN chmod +x ./init.sh

# Change ownership of app to the nextjs user
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV HOSTNAME="0.0.0.0"

# Add a healthcheck (optional, helps Dokploy / Docker restart logic)
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/api/health || exit 1

ENTRYPOINT ["./init.sh"]
CMD ["node", "server.js"]
