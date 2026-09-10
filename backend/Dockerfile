FROM node:22-alpine

WORKDIR /app/backend

COPY backend/package.json ./package.json
RUN npm install --omit=dev

COPY backend/ ./
COPY database/ /app/database/

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["sh", "-c", "npm run migrate && npm start"]
