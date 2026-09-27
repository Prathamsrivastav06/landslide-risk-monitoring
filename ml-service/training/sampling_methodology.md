# Landslide Risk Classification - Sampling Methodology

## Positive Samples
Historical landslide events are extracted from the ISRO/GSI inventory.
- Each event is a confirmed landslide occurrence.
- Features are extracted from the environmental data closest to the event date/location.
- We fallback to terrain-only data if environmental data is not available for that date.

## Negative Samples
Non-event background samples are drawn using stratified spatial sampling.
- **Why random sampling is avoided**: Truly random points might land in places where landslides are impossible (like flat plains) or where data is missing, biasing the model unfairly and creating artificially high accuracy.
- **Strategy**: Constrained to locations where NO landslide occurred within a 2km radius in the same year.
- Ensure samples are taken from similar terrain (NER mountains) to reduce geographic bias.
- Drawn from multiple time periods (both monsoon and non-monsoon months) to capture temporal variation in features like rainfall and soil moisture.
- **Ratio**: 3:1 negative to positive to reflect that landslides are relatively rare events.

## Class Imbalance Handling
The resulting dataset will have a 3:1 imbalance in favor of non-events. We handle this directly in the `RandomForestClassifier` by setting `class_weight='balanced'`. This penalizes the model more for missing a true landslide (false negative) than for predicting one where it didn't occur (false positive).

## Temporal Validation Approach
To prevent data leakage from the future, validation is performed with a time-aware split:
- **Training Set**: Events occurring before 2020.
- **Test Set**: Events from 2020 to 2022.
This evaluates the model's true predictive capability on unseen future events, simulating how it will perform in real-time deployment.

## Known Limitations
- The model's accuracy is strongly bounded by the resolution and quality of the input remote sensing data (NASA POWER, SMAP, etc.).
- The historical record of landslides might itself be biased toward populated areas where events are observed and recorded.
