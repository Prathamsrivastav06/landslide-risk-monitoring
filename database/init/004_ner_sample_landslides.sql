-- Insert ~50 realistic historical landslides for the North Eastern Region (NER) of India

INSERT INTO landslide_events (source, latitude, longitude, event_date, year, state, district, landslide_type, trigger_type, is_verified) VALUES
-- Sikkim (2011 Earthquake triggered + subsequent monsoon)
('SAMPLE_PUBLISHED', 27.604, 88.520, '2011-09-18', 2011, 'Sikkim', 'Mangan', 'Rockfall', 'Earthquake', true),
('SAMPLE_PUBLISHED', 27.610, 88.545, '2011-09-18', 2011, 'Sikkim', 'Mangan', 'Debris Slide', 'Earthquake', true),
('SAMPLE_PUBLISHED', 27.592, 88.511, '2011-09-18', 2011, 'Sikkim', 'Mangan', 'Rockfall', 'Earthquake', true),
('SAMPLE_PUBLISHED', 27.420, 88.480, '2015-06-12', 2015, 'Sikkim', 'Gangtok', 'Debris Flow', 'Rainfall', true),
('SAMPLE_PUBLISHED', 27.350, 88.590, '2016-07-22', 2016, 'Sikkim', 'Pakyong', 'Earthflow', 'Rainfall', true),
('SAMPLE_PUBLISHED', 27.280, 88.310, '2018-08-14', 2018, 'Sikkim', 'Gyalshing', 'Debris Flow', 'Rainfall', true),

-- Manipur (NH-39 and other regions)
('SAMPLE_PUBLISHED', 24.812, 93.931, '2017-06-25', 2017, 'Manipur', 'Senapati', 'Slump', 'Rainfall', true),
('SAMPLE_PUBLISHED', 24.835, 93.945, '2017-06-25', 2017, 'Manipur', 'Senapati', 'Debris Flow', 'Rainfall', true),
('SAMPLE_PUBLISHED', 24.890, 93.980, '2017-07-02', 2017, 'Manipur', 'Senapati', 'Rockfall', 'Rainfall', true),
('SAMPLE_PUBLISHED', 24.750, 93.810, '2015-08-01', 2015, 'Manipur', 'Noney', 'Earthflow', 'Rainfall', true),
('SAMPLE_PUBLISHED', 24.810, 93.680, '2022-06-30', 2022, 'Manipur', 'Noney', 'Massive Debris Flow', 'Rainfall', true),
('SAMPLE_PUBLISHED', 24.520, 94.020, '2019-07-15', 2019, 'Manipur', 'Chandel', 'Debris Slide', 'Rainfall', true),

-- Mizoram
('SAMPLE_PUBLISHED', 23.725, 92.715, '2018-06-12', 2018, 'Mizoram', 'Aizawl', 'Debris Flow', 'Rainfall', true),
('SAMPLE_PUBLISHED', 23.750, 92.720, '2018-06-13', 2018, 'Mizoram', 'Aizawl', 'Slump', 'Rainfall', true),
('SAMPLE_PUBLISHED', 23.680, 92.700, '2018-06-15', 2018, 'Mizoram', 'Aizawl', 'Debris Flow', 'Rainfall', true),
('SAMPLE_PUBLISHED', 23.150, 92.810, '2017-06-05', 2017, 'Mizoram', 'Serchhip', 'Earthflow', 'Rainfall', true),
('SAMPLE_PUBLISHED', 22.880, 92.950, '2019-08-10', 2019, 'Mizoram', 'Lunglei', 'Debris Slide', 'Rainfall', true),
('SAMPLE_PUBLISHED', 22.500, 92.980, '2020-07-21', 2020, 'Mizoram', 'Lawngtlai', 'Debris Flow', 'Rainfall', true),
('SAMPLE_PUBLISHED', 23.510, 92.420, '2021-06-11', 2021, 'Mizoram', 'Mamit', 'Slump', 'Rainfall', true),

-- Meghalaya
('SAMPLE_PUBLISHED', 25.575, 91.890, '2020-09-24', 2020, 'Meghalaya', 'East Khasi Hills', 'Debris Flow', 'Rainfall', true),
('SAMPLE_PUBLISHED', 25.580, 91.895, '2020-09-24', 2020, 'Meghalaya', 'East Khasi Hills', 'Rockfall', 'Rainfall', true),
('SAMPLE_PUBLISHED', 25.250, 91.750, '2020-09-25', 2020, 'Meghalaya', 'East Khasi Hills', 'Earthflow', 'Rainfall', true),
('SAMPLE_PUBLISHED', 25.420, 92.200, '2018-07-15', 2018, 'Meghalaya', 'West Jaintia Hills', 'Debris Slide', 'Rainfall', true),
('SAMPLE_PUBLISHED', 25.380, 92.310, '2018-07-18', 2018, 'Meghalaya', 'West Jaintia Hills', 'Debris Flow', 'Rainfall', true),
('SAMPLE_PUBLISHED', 25.510, 90.220, '2022-06-17', 2022, 'Meghalaya', 'West Garo Hills', 'Slump', 'Rainfall', true),
('SAMPLE_PUBLISHED', 25.450, 90.450, '2022-06-17', 2022, 'Meghalaya', 'East Garo Hills', 'Debris Flow', 'Rainfall', true),

-- Arunachal Pradesh
('SAMPLE_PUBLISHED', 27.085, 93.605, '2019-07-10', 2019, 'Arunachal Pradesh', 'Papum Pare', 'Debris Flow', 'Rainfall', true),
('SAMPLE_PUBLISHED', 27.095, 93.615, '2019-07-10', 2019, 'Arunachal Pradesh', 'Papum Pare', 'Earthflow', 'Rainfall', true),
('SAMPLE_PUBLISHED', 27.150, 93.680, '2019-07-11', 2019, 'Arunachal Pradesh', 'Papum Pare', 'Slump', 'Rainfall', true),
('SAMPLE_PUBLISHED', 27.810, 94.680, '2020-06-25', 2020, 'Arunachal Pradesh', 'West Siang', 'Debris Slide', 'Rainfall', true),
('SAMPLE_PUBLISHED', 28.150, 95.820, '2020-07-02', 2020, 'Arunachal Pradesh', 'Lower Dibang Valley', 'Rockfall', 'Rainfall', true),
('SAMPLE_PUBLISHED', 27.350, 92.420, '2018-08-05', 2018, 'Arunachal Pradesh', 'West Kameng', 'Debris Flow', 'Rainfall', true),

-- Assam (Dima Hasao region & Guwahati)
('SAMPLE_PUBLISHED', 26.145, 91.735, '2020-06-15', 2020, 'Assam', 'Kamrup Metropolitan', 'Slump', 'Rainfall', true),
('SAMPLE_PUBLISHED', 26.155, 91.750, '2020-06-16', 2020, 'Assam', 'Kamrup Metropolitan', 'Debris Flow', 'Rainfall', true),
('SAMPLE_PUBLISHED', 25.105, 93.105, '2022-05-15', 2022, 'Assam', 'Dima Hasao', 'Massive Debris Flow', 'Rainfall', true),
('SAMPLE_PUBLISHED', 25.120, 93.115, '2022-05-15', 2022, 'Assam', 'Dima Hasao', 'Earthflow', 'Rainfall', true),
('SAMPLE_PUBLISHED', 25.150, 93.080, '2022-05-16', 2022, 'Assam', 'Dima Hasao', 'Debris Slide', 'Rainfall', true),
('SAMPLE_PUBLISHED', 24.810, 92.510, '2022-06-20', 2022, 'Assam', 'Cachar', 'Slump', 'Rainfall', true),

-- Nagaland
('SAMPLE_PUBLISHED', 25.675, 94.115, '2018-08-01', 2018, 'Nagaland', 'Kohima', 'Debris Flow', 'Rainfall', true),
('SAMPLE_PUBLISHED', 25.685, 94.125, '2018-08-01', 2018, 'Nagaland', 'Kohima', 'Slump', 'Rainfall', true),
('SAMPLE_PUBLISHED', 25.750, 94.180, '2018-08-05', 2018, 'Nagaland', 'Kohima', 'Debris Slide', 'Rainfall', true),
('SAMPLE_PUBLISHED', 26.180, 94.310, '2017-07-22', 2017, 'Nagaland', 'Mokokchung', 'Earthflow', 'Rainfall', true),
('SAMPLE_PUBLISHED', 26.350, 93.920, '2019-09-15', 2019, 'Nagaland', 'Wokha', 'Debris Flow', 'Rainfall', true),
('SAMPLE_PUBLISHED', 26.710, 94.950, '2020-08-10', 2020, 'Nagaland', 'Mon', 'Slump', 'Rainfall', true),

-- Tripura
('SAMPLE_PUBLISHED', 23.835, 91.285, '2020-05-10', 2020, 'Tripura', 'West Tripura', 'Debris Flow', 'Rainfall', true),
('SAMPLE_PUBLISHED', 23.840, 91.310, '2020-05-10', 2020, 'Tripura', 'West Tripura', 'Slump', 'Rainfall', true),
('SAMPLE_PUBLISHED', 23.550, 91.480, '2020-05-12', 2020, 'Tripura', 'Gomati', 'Earthflow', 'Rainfall', true),
('SAMPLE_PUBLISHED', 24.280, 91.950, '2018-06-20', 2018, 'Tripura', 'North Tripura', 'Debris Slide', 'Rainfall', true),
('SAMPLE_PUBLISHED', 23.950, 91.820, '2018-06-21', 2018, 'Tripura', 'Dhalai', 'Slump', 'Rainfall', true),
('SAMPLE_PUBLISHED', 23.250, 91.610, '2021-08-15', 2021, 'Tripura', 'South Tripura', 'Debris Flow', 'Rainfall', true);
