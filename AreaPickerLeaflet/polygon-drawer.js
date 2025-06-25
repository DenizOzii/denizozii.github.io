class PolygonDrawer {
    constructor() {
        this.map = null;
        this.currentPoints = [];
        this.currentMarkers = [];
        this.currentPolyline = null;
        this.completedPolygons = [];
        this.isDrawing = false;
        this.websocket = null;

        this.init();
        this.initWebSocket();
    }
    
    init() {
        // Initialize the map - centered on LTAD Etimesgut Airbase, Ankara, Turkey
        this.map = L.map('map').setView([39.9508, 32.6890], 13);

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Remove Leaflet attribution with Ukraine flag
        this.map.attributionControl.setPrefix('');

        // Bind events
        this.bindEvents();
        this.updateUI();
    }

    initWebSocket() {
        try {
            this.websocket = new WebSocket('ws://localhost:8080');

            this.websocket.onopen = () => {
                console.log('WebSocket connected to port 8080');
            };

            this.websocket.onclose = () => {
                console.log('WebSocket connection closed');
                // Attempt to reconnect after 3 seconds
                setTimeout(() => this.initWebSocket(), 3000);
            };

            this.websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

        } catch (error) {
            console.error('Failed to initialize WebSocket:', error);
        }
    }
    
    bindEvents() {
        // Map click events
        this.map.on('click', (e) => this.onMapClick(e));
        this.map.on('contextmenu', (e) => this.onMapRightClick(e));
        
        // Control buttons
        document.getElementById('undoBtn').addEventListener('click', () => this.undoLast());
        
        // Disable default context menu
        this.map.getContainer().addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    onMapClick(e) {
        const point = [e.latlng.lat, e.latlng.lng];
        this.addPoint(point);
    }
    
    onMapRightClick(e) {
        // Check if we right-clicked on a corner marker
        const clickedMarker = this.getMarkerAtPosition(e.latlng);
        
        if (clickedMarker) {
            this.removePoint(clickedMarker);
        } else if (this.currentPoints.length >= 3) {
            // Right-clicked on empty space with enough points - finalize polygon
            this.finalizePolygon();
        }
    }
    
    addPoint(point) {
        this.currentPoints.push(point);
        
        // Create marker for the corner
        const marker = L.circleMarker(point, {
            radius: 6,
            fillColor: '#ff6b6b',
            color: 'white',
            weight: 2,
            opacity: 1,
            fillOpacity: 1,
            className: 'corner-marker'
        }).addTo(this.map);
        
        // Store reference to the point index
        marker.pointIndex = this.currentPoints.length - 1;
        this.currentMarkers.push(marker);
        
        this.updateCurrentPolyline();
        this.updateUI();
    }
    
    removePoint(marker) {
        const index = marker.pointIndex;
        
        // Remove from arrays
        this.currentPoints.splice(index, 1);
        this.currentMarkers.splice(index, 1);
        
        // Remove marker from map
        this.map.removeLayer(marker);
        
        // Update indices for remaining markers
        this.currentMarkers.forEach((m, i) => {
            m.pointIndex = i;
        });
        
        this.updateCurrentPolyline();
        this.updateUI();
    }
    
    updateCurrentPolyline() {
        // Remove existing polyline
        if (this.currentPolyline) {
            this.map.removeLayer(this.currentPolyline);
        }
        
        // Create new polyline if we have points
        if (this.currentPoints.length > 1) {
            this.currentPolyline = L.polyline(this.currentPoints, {
                color: '#3388ff',
                weight: 2,
                opacity: 0.8,
                dashArray: '5, 5'
            }).addTo(this.map);
        }
    }
    
    finalizePolygon() {
        if (this.currentPoints.length < 3) {
            alert('Need at least 3 points to create a polygon');
            return;
        }
        
        // Create the final polygon
        const polygon = L.polygon(this.currentPoints, {
            color: '#ff7800',
            weight: 2,
            opacity: 1,
            fillColor: '#ff7800',
            fillOpacity: 0.2
        }).addTo(this.map);
        
        // Add popup with area information
        const area = this.calculatePolygonArea(this.currentPoints);
        polygon.bindPopup(`
            <strong>Polygon ${this.completedPolygons.length + 1}</strong><br>
            Points: ${this.currentPoints.length}<br>
            Area: ${area.toFixed(2)} km²
        `);
        
        // Prepare polygon data for WebSocket
        const polygonData = {
            id: this.completedPolygons.length + 1,
            timestamp: new Date().toISOString(),
            points: this.currentPoints.map(point => ({
                latitude: point[0],
                longitude: point[1]
            })),
            pointCount: this.currentPoints.length,
            area: {
                value: area,
                unit: 'km²'
            },
            bounds: this.calculateBounds(this.currentPoints),
            center: this.calculateCenter(this.currentPoints)
        };

        // Send polygon data through WebSocket
        this.sendPolygonData(polygonData);

        this.completedPolygons.push({
            polygon: polygon,
            points: [...this.currentPoints],
            data: polygonData
        });

        this.clearCurrent();
        this.updateUI();
    }
    
    clearCurrent() {
        // Remove current markers
        this.currentMarkers.forEach(marker => this.map.removeLayer(marker));
        
        // Remove current polyline
        if (this.currentPolyline) {
            this.map.removeLayer(this.currentPolyline);
        }
        
        // Reset arrays
        this.currentPoints = [];
        this.currentMarkers = [];
        this.currentPolyline = null;
    }
    

    
    undoLast() {
        if (this.currentPoints.length > 0) {
            const lastMarker = this.currentMarkers[this.currentMarkers.length - 1];
            this.removePoint(lastMarker);
        }
    }
    
    getMarkerAtPosition(latlng) {
        // Find marker within a small radius of the click
        const threshold = 0.0001; // Adjust based on zoom level
        
        return this.currentMarkers.find(marker => {
            const markerLatLng = marker.getLatLng();
            const distance = Math.sqrt(
                Math.pow(markerLatLng.lat - latlng.lat, 2) +
                Math.pow(markerLatLng.lng - latlng.lng, 2)
            );
            return distance < threshold;
        });
    }
    
    calculatePolygonArea(points) {
        // Simple area calculation using the shoelace formula
        // Note: This gives area in degrees squared, converted to approximate km²
        if (points.length < 3) return 0;
        
        let area = 0;
        for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length;
            area += points[i][0] * points[j][1];
            area -= points[j][0] * points[i][1];
        }
        area = Math.abs(area) / 2;
        
        // Very rough conversion to km² (this is approximate)
        return area * 12100; // Rough conversion factor
    }
    
    sendPolygonData(polygonData) {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            try {
                const message = {
                    type: 'polygon_finalized',
                    data: polygonData
                };
                this.websocket.send(JSON.stringify(message));
                console.log('Polygon data sent via WebSocket:', polygonData);
            } catch (error) {
                console.error('Failed to send polygon data:', error);
            }
        } else {
            console.warn('WebSocket not connected. Polygon data not sent:', polygonData);
        }
    }

    calculateBounds(points) {
        if (points.length === 0) return null;

        let minLat = points[0][0], maxLat = points[0][0];
        let minLng = points[0][1], maxLng = points[0][1];

        points.forEach(point => {
            minLat = Math.min(minLat, point[0]);
            maxLat = Math.max(maxLat, point[0]);
            minLng = Math.min(minLng, point[1]);
            maxLng = Math.max(maxLng, point[1]);
        });

        return {
            north: maxLat,
            south: minLat,
            east: maxLng,
            west: minLng
        };
    }

    calculateCenter(points) {
        if (points.length === 0) return null;

        const sumLat = points.reduce((sum, point) => sum + point[0], 0);
        const sumLng = points.reduce((sum, point) => sum + point[1], 0);

        return {
            latitude: sumLat / points.length,
            longitude: sumLng / points.length
        };
    }

    updateUI() {
        // Update button states
        document.getElementById('undoBtn').disabled = this.currentPoints.length === 0;
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PolygonDrawer();
});
