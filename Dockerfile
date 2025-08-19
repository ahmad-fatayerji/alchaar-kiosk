##############################
# Production multi-stage build
##############################

# 1) Builder: install deps and build Next.js
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --production=false

# Copy source and build
COPY . .
# Ensure required public subfolders exist even if empty in git
RUN mkdir -p public public/categories public/products
RUN npx prisma generate
RUN npm run build

# 2) Runner: minimal runtime image
FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# Install small utilities for healthcheck and DB wait
RUN apk add --no-cache curl netcat-openbsd

# Create unprivileged user
RUN addgroup -S app && adduser -S -G app app

# Copy only what runtime needs
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY docker/entrypoint.sh ./docker/entrypoint.sh

# Ensure entrypoint is executable
RUN chmod +x ./docker/entrypoint.sh

USER app
EXPOSE 3000

# Healthcheck hits the root page
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -fsS http://localhost:3000/ || exit 1

ENTRYPOINT ["./docker/entrypoint.sh"]
CMD ["npm","start"]
