# ---- Base Node ----
FROM node:24-slim AS base
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY package.json package-lock.json* bun.lock* ./
RUN npm install

# ---- Build ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Ensure public directory exists (Next.js standalone expects it)
RUN mkdir -p public

# Environment variable specifically for Prisma logic during build
ENV DATABASE_URL="file:/app/data/sqlite.db"
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma Client & Build the app
RUN npx prisma generate
RUN npm run build

# ---- Production ----
FROM base AS runner

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:/app/data/sqlite.db"
ENV PORT=3000

# Create the persistent data directory
RUN mkdir -p /app/data

# Create non-root user
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs

# Install deps needed for prisma db push + seed script on first run
RUN npm install prisma@^5.22.0 @prisma/client@^5.22.0 bcryptjs tsx

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

ENTRYPOINT ["./init.sh"]
CMD ["node", "server.js"]
