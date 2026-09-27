exports.isWithinNER = (lat, lon) => {
    // NER Bounding box roughly: 20-30N, 88-98E, with margin
    const minLat = 20.0, maxLat = 30.0;
    const minLon = 88.0, maxLon = 98.0;
    
    return lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;
};

exports.calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

exports.bboxToCoordinates = (bboxStr) => {
    if (!bboxStr) return null;
    const parts = bboxStr.split(',').map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) return null;
    return {
        minLon: parts[0],
        minLat: parts[1],
        maxLon: parts[2],
        maxLat: parts[3]
    };
};
