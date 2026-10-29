# Imagen mínima para instalar la lista prioritaria en un proyecto montado.
# Uso:
#   docker build -t cursor-skills-kit .
#   docker run --rm -v "%CD%:/workspace" -w /workspace cursor-skills-kit
#   docker run --rm -v "%CD%:/workspace" -w /workspace cursor-skills-kit --dry-run
FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends git ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /kit
COPY priority/priority-skills.json /kit/priority/priority-skills.json
COPY bin/install.sh /kit/bin/install.sh
RUN chmod +x /kit/bin/install.sh

WORKDIR /workspace
ENTRYPOINT ["/kit/bin/install.sh", "--manifest", "/kit/priority/priority-skills.json", "--target", "/workspace"]
