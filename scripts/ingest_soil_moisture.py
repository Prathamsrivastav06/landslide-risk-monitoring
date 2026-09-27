import os
import sys

def print_auth_instructions():
    print(\"\"\"
NASA SMAP Soil Moisture requires NASA Earthdata authentication:
  1. Register FREE at: https://urs.earthdata.nasa.gov/
  2. Set in .env:
     NASA_EARTHDATA_USERNAME=your_username
     NASA_EARTHDATA_PASSWORD=your_password
  3. Create ~/.netrc file:
     machine urs.earthdata.nasa.gov
     login your_username
     password your_password
  4. Install: pip install h5py
Soil moisture will show as 'unavailable' in the UI until configured.
\"\"\")

def main():
    username = os.environ.get('NASA_EARTHDATA_USERNAME')
    password = os.environ.get('NASA_EARTHDATA_PASSWORD')
    
    if not username or not password:
        print_auth_instructions()
        sys.exit(0) # Not an error, just graceful exit
        
    print("Earthdata credentials found. Attempting to query CMR for SPL3SMP.008...")
    
    import requests
    
    cmr_url = "https://cmr.earthdata.nasa.gov/search/granules.json"
    params = {
        'short_name': 'SPL3SMP',
        'version': '008',
        'bounding_box': '88.0,20.0,98.0,30.0', # NER Bounds
        'sort_key': '-start_date',
        'page_size': 1
    }
    
    try:
        response = requests.get(cmr_url, params=params)
        response.raise_for_status()
        data = response.json()
        
        granules = data.get('feed', {}).get('entry', [])
        if not granules:
            print("No recent granules found for SMAP SPL3SMP.008")
        else:
            latest = granules[0]
            print(f"Latest granule found: {latest.get('title')}")
            print(f"Data link: {latest.get('links', [{}])[0].get('href')}")
            
        print("\nNote: Full HDF5 parsing of SMAP data requires the 'h5py' library and ~/.netrc configured.")
        print("Status: Soil moisture data currently set to 'unavailable' for prototype.")
    except Exception as e:
        print(f"Error querying CMR: {e}")

if __name__ == '__main__':
    main()
