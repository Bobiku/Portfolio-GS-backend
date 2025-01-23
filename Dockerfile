# Step 1: We build the angular app using the production config
FROM --platform=linux/arm64 node:22-alpine AS build
# Set the working directory
WORKDIR /app
# Copy the package.json and package-lock.json files
COPY package*.json ./
# Run a clean install of the dependencies
RUN npm ci
# Copy all files
COPY . .
# Exposer le port utilisé par l'application
EXPOSE 3000
# Définir la commande à exécuter pour démarrer l'application
CMD ["npm", "start"]

# Build: docker buildx build --platform=linux/arm64 -t portfolio-gs-backend .
# Run: docker run -d -p 3000:3000 portfolio-gs-backend
# Tag registry: docker image tag portfolio-gs-backend registry.local.savaryguillaume.fr/portfolio-gs-backend:[version-plateform]
# Registry: docker push registry.local.savaryguillaume.fr/portfolio-gs-backend:[version.plateform]