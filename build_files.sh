#!/bin/bash
echo "==> Installing python dependencies..."
python3 -m pip install -r requirements.txt

echo "==> Running collectstatic..."
python3 manage.py collectstatic --noinput --clear

echo "==> Build complete!"
