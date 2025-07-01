# ---- 1. base image ----
FROM node:20-alpine

# ---- 2. deps ----
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ---- 3. source & build ----
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- 4. run ----
EXPOSE 3000
CMD ["npm","start"]
