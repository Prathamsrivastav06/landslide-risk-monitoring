
from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_PORT = int(os.environ.get('DB_PORT', 5432))
DB_NAME = os.environ.get('DB_NAME', 'landslide_db')
DB_USER = os.environ.get('DB_USER', 'landslide_user')
DB_PASSWORD = os.environ.get('DB_PASSWORD', '')

NASA_EARTHDATA_USERNAME = os.environ.get('NASA_EARTHDATA_USERNAME', '')
NASA_EARTHDATA_PASSWORD = os.environ.get('NASA_EARTHDATA_PASSWORD', '')

NER_BOUNDS = {'min_lat': 20.0, 'max_lat': 30.0, 'min_lon': 88.0, 'max_lon': 98.0}
NER_STATES = ['Sikkim', 'Arunachal Pradesh', 'Assam', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Tripura']

OPEN_ELEVATION_URL = 'https://api.open-elevation.com/api/v1/lookup'
NASA_POWER_URL = 'https://power.larc.nasa.gov/api/temporal/daily/point'
