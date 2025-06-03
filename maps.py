import pandas as pd
import folium
from folium.plugins import MarkerCluster
import random

# Create a map centered at Zambia
myMap = folium.Map(location=[-13.1339, 27.8493], tiles='OpenStreetMap', zoom_start=6)

# Create a MarkerCluster group
mapCluster = MarkerCluster().add_to(myMap)

# Sample retail store data (in a real scenario, this would come from your CSV)
# Let's simulate some store data based on the provincial capitals from your CSV
Land_data = {
    "Land Name": ["Plot Number 0001", "Plot Number 0002", "Plot Number 0003", 
                  "Plot Number 0004", "Plot Number 0005", "Plot Number 0006", 
                  "Plot Number 0007", "Plot Number 0008", "Plot Number 0009", "Plot Number 0010"],
    "City": ["Chinsali", "Chipata", "Choma", "Kabwe", "Kasama", 
             "Lusaka", "Mansa", "Mongu", "Ndola", "Solwezi"],
    "Latitude": [-11.3222, -13.631, -16.538, -14.4584, -10.1396,
                -15.3875, -10.592, -15.2489, -12.8308, -12.244],
    "Longitude": [31.3659, 32.64, 26.8221, 28.446, 30.2354,
                 28.3228, 29.3322, 23.1261, 28.211, 25.7481],
    "Ocupation": ["Available", "Pending", "Private", "Private", "Pending",
                "Available", "Pending", "Private", "Available", "Available"],
}

# Convert to DataFrame
df_stores = pd.DataFrame(Land_data)

# Define custom icons based on services
Ocupation_icons = {
    "Private": "red",
    "Pending": "yellow",
    "Available": "green",
}

# Define colors for different services
Ocupation_colors = {
    "Private": "red",
    "Pending": "yellow",
    "Available": "green",
}

# Add markers for each store
for index, row in df_stores.iterrows():
    # Get the appropriate icon and color
    Opcupation = row["Ocupation"]
    icon_type = Ocupation_icons.get(Ocupation, "info-sign")  # default icon
    icon_color = Ocupation.get(Ocupation, "gray")     # default color
    
    # Create custom popup content with HTML formatting
    popup_content = f"""
    <div style='width: 200px;'>
        <h4 style='margin-bottom: 5px;'>{row['Land Name']}</h4>
        <p><b>Location:</b> {row['City']}</p>
        <p><b>Ocupation:</b> {row['Ocupation']}</p>
    </div>
    """
    
    # Create marker with custom icon and popup
    folium.Marker(
        location=[row["Latitude"], row["Longitude"]],
        popup=folium.Popup(popup_content, max_width=250),
        icon=folium.Icon(icon=icon_type, color=icon_color, prefix='fa')
    ).add_to(mapCluster)

# Add layer control
folium.LayerControl().add_to(myMap)

# Add title to the map
title_html = '''
    <h3 align="center" style="font-size:16px"><b>Land Registry System</b></h3>
'''
myMap.get_root().html.add_child(folium.Element(title_html))

# Save the map
myMap.save('map.html')