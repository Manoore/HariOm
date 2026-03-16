# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies comprehensively
# Including libraries needed for:
# - bcrypt (password hashing)
# - pyswisseph (C compilation)
# - cryptography (SSL/TLS)
# - Pillow (image processing)
# - General Python C extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    make \
    libffi-dev \
    curl \
    build-essential \
    python3-dev \
    libssl-dev \
    libjpeg-dev \
    zlib1g-dev \
    libpng-dev \
    cargo \
    rustc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
# Note: bcrypt needs to be compiled with rust/cargo for newer versions
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir bcrypt==4.0.1 && \
    pip install --no-cache-dir -r requirements.txt

# Install emergentintegrations from private index
RUN pip install --no-cache-dir emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Set environment variables
ENV PORT=8080
ENV HOST=0.0.0.0
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Health check with longer start period for slow imports
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

# Run the startup script for better error diagnostics
CMD ["python", "-u", "start.py"]
