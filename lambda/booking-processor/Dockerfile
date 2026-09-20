# Build context = racine du repo (voir docker build -f lambda/booking-processor/Dockerfile .)
# necessaire pour copier backend/prisma sans dupliquer le schema.

FROM public.ecr.aws/lambda/nodejs:20 AS builder

WORKDIR /build

COPY lambda/booking-processor/package*.json ./
RUN npm ci

COPY backend/prisma ./prisma
RUN npx prisma generate

COPY lambda/booking-processor/index.ts lambda/booking-processor/tsconfig.json ./
RUN npm run build

FROM public.ecr.aws/lambda/nodejs:20

WORKDIR /var/task

COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/dist/index.js ./
COPY --from=builder /build/prisma ./prisma

CMD ["index.handler"]
