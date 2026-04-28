#!/bin/bash

# Meal-Box Frontend Deployment Script
# Run this from the frontend-next directory

echo "🚀 Building Meal-Box Frontend..."

# Build the static export
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"

    echo "📦 Preparing deployment package..."

    # Create deployment directory
    mkdir -p ../deployment
    cp -r out/* ../deployment/

    echo "📁 Deployment files ready in ../deployment/"
    echo ""
    echo "📋 Next steps:"
    echo "1. Upload ALL files from ../deployment/ to your domain root in cPanel"
    echo "2. Make sure .htaccess file is uploaded (it handles routing)"
    echo "3. Test: https://mealfront.magnusideas.com/product/69d34aac1166ed821494a695/"
    echo ""
    echo "🔧 If still getting 404, check:"
    echo "- .htaccess file is uploaded"
    echo "- Apache mod_rewrite is enabled"
    echo "- Files are in domain root, not a subfolder"
else
    echo "❌ Build failed! Check errors above."
    exit 1
fi