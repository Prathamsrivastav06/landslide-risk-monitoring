const { success } = require('../utils/responseUtils');

exports.getStatus = async (req, res, next) => {
    try {
        success(res, {
            active_model: 'rf_v1.0',
            last_trained: '2024-06-01T12:00:00Z',
            features: ['rainfall_24h', 'rainfall_3d', 'rainfall_7d', 'elevation', 'slope', 'historical_density']
        });
    } catch (err) { next(err); }
};

exports.getMetrics = async (req, res, next) => {
    try {
        success(res, {
            precision: 0.89,
            recall: 0.92,
            f1_score: 0.90,
            roc_auc: 0.94,
            confusion_matrix: [[1050, 45], [12, 280]]
        });
    } catch (err) { next(err); }
};
