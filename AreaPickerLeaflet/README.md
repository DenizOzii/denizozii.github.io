# Area Picker - Leaflet Polygon Drawing Application

A web application for drawing polygons on a Leaflet map with intuitive click-based interactions.

## Features

- **Interactive Polygon Drawing**: Create polygons by clicking to add corners
- **Corner Management**: Right-click corners to remove them
- **Polygon Finalization**: Right-click empty space to complete polygons
- **Visual Feedback**: See your polygon as you draw with a dashed preview line
- **Area Calculation**: Automatic area calculation for completed polygons
- **Multiple Polygons**: Draw multiple polygons on the same map
- **Undo/Clear Functions**: Remove last point or clear all polygons

## How to Use

### Drawing Polygons
1. **Left click** on the map to add polygon corners
2. **Right click** on empty space to finalize the polygon (requires at least 3 points)
3. **Right click** on a corner marker to remove that specific corner

### Controls
- **Clear All**: Remove all polygons and current drawing
- **Undo Last**: Remove the last added point
- **Polygon Counter**: Shows number of completed polygons
- **Point Counter**: Shows current points in active drawing

### Visual Elements
- **Red circles**: Corner markers for the current polygon being drawn
- **Blue dashed line**: Preview of the current polygon shape
- **Orange polygons**: Completed polygons with semi-transparent fill
- **Popups**: Click completed polygons to see details (points count and area)

## Getting Started

1. Open `index.html` in a web browser
2. The map will load centered on New York City
3. Start clicking to draw your first polygon!

## Technical Details

- Built with Leaflet.js for mapping functionality
- Uses OpenStreetMap tiles
- Responsive design that works on desktop and mobile
- No server required - runs entirely in the browser

## Files

- `index.html` - Main HTML page with map container and UI
- `polygon-drawer.js` - Core JavaScript functionality for polygon drawing
- `README.md` - This documentation file

## Browser Compatibility

Works in all modern browsers that support:
- ES6 JavaScript features
- Leaflet.js (latest version)
- HTML5 and CSS3
