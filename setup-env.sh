#!/bin/bash

# Create .env file with correct values
echo "Creating .env file with Supabase configuration..."
cat > .env << EOL
VITE_SUPABASE_URL=https://bijyercgpgaheeoeumtv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpanllcmNncGdhaGVlb2V1bXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMDcyODgsImV4cCI6MjA2Mjg4MzI4OH0.dU3hjP96CWZqiIc90oYEAXCslgUDvoANpYrSg69oy_g
EOL

echo ".env file created successfully!" 