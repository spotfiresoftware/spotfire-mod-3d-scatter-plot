
# 3D Scatter Plot Mod for TIBCO Spotfire®

The 3D Scatter Plot mod is built using [PlotlyJS](https://plotly.com/javascript/) and allows visualizing three variables in 3-dimensional space. The chart can be rotated in 3-dimensional space to re-orient the chart so that details can be observed. The mod exposes the majority of the Plotly API through a JSON configuration interface.

One particularly useful case for this chart is to visualize 3-dimensional well trajectories.

## Installing the 3D Scatter Plot

This Mod can be added to your Spotfire analysis by either importing the .mod file provided in this download, or by building the Mod project and connecting to this via Spotfire.

### Importing the .mod file

1. Open a Spotfire analysis
2. On the authoring bar, open the Visualization types flyout
3. Click the button to the right of Visualization types
4. In the opened menu, select Browse for visualization
5. Locate and open the visualization Mod. The visualization Mod is added to the analysis

For more information on how to use and share visualization Mods, you can [read the Spotfire documentation](https://docs.tibco.com/pub/sfire-analyst/11.0.0/doc/html/en-US/TIB_sfire-analyst_UsersGuide/index.htm?_ga=2.41319073.2072719993.1606728875-1950738096.1600074380#t=modvis%2Fmodvis_how_to_use_a_visualization_mod.htm).

### Building the Mod project

In the [Getting started guide on GitHub](http://spotfi.re/mods-getting-started-guide/), you will find complete information on how to build and run a Mod from a local development server. This site also contains all information on how to get started with Mod development.

## Data Requirements

**Every Mod handles missing, corrupted and/or inconsistent data in different ways. It is advised to always review how the data is visualized before using the Mod in production.**

The data must be exist in a single table with 3 variables for each of the x, y, and z axes. 

## Setting up the 3D Scatter Plot

Specify the data table with marking and filters as usual. Note that the chart supports click and drag to rotate the chart in 3D. This conflicts with the click to mark option in Spotfire, so it is recommended to choose (None) as the Marking option for the chart.

Select a value for the **Line by** configuration. The chart will render one line per value in this column.

Select a value for the **Order by** configuration. This will determine the order that the points will be plotted on the chart and will be important to ensure any connecting lines are drawn correctly.

Select values for **X**, **Y**, and **Z** configurations. This will determine the value for each of the axes. These values are available surrounding the chart as well. X and Y are in the normal locations at the bottom and to the left of the plot area. The Z axis is the value to the right of the plot area.

Select a value for the **Color by** configuration. This will determine the color of any lines and markers using standard Spotfire color picker.

At this point the chart will still not be rendered as the Plotly configuration needs to be setup. See Configuring the 3D Scatter Plot for details. 

## Configuring the 3D Scatter Plot

The configuration for the chart is completed using an included text editor. To access the editor, double-click on the center of the plot area. This will present a box titled **Plotly Configuration** and an editor that will contain the configuration in JSON format. 

Most of the Plotly JS API configuration options are available. Refer to the Plotly website for details of the API. But as a starting point, the following JSON string will render a standard 3D plot.

```
{
  "layout": {
    "font": {
      "color": "#BBBBBB",
      "size": 10
    },
    "margin": {
      "t": 0,
      "r": 0,
      "b": 10,
      "l": 0,
      "autoexpand": false
    },
    "paper_bgcolor": "transparent",
    "plot_bgcolor": "transparent",
    "scene": {
      "camera": {
        "eye": {
          "x": 1.1,
          "y": 1.1,
          "z": 1.1
        }
      },
      "xaxis": {    
        "gridcolor": "#BBBBBB",
        "title": "Easting"
      },
      "yaxis": {
        "gridcolor": "#BBBBBB",
        "title": "Northing"
      },
      "zaxis": {
        "gridcolor": "#BBBBBB",
        "title": "TVD"
      }      
    },
    "showlegend": true
  },
    
  "options": {
    "displayModeBar": false
  },
	
  "defaultTrace": {
    "eval_text": "'<b>ACTUAL</b><br><br><b>Easting:</b> ' + object.Easting + '<br><b>Northing:</b> ' + object.Northing + '<br><b>TVD:</b> ' + object.TVD + '<br><b>Inc:</b> ' + object.Inclination + '<br><b>Azi:</b> ' + object.Azimuth",
    "hoverinfo": "text",
    "mode": "lines+markers",
    "line": {
      "width": 5
    },
    "marker": {
      "size": 1
    },	
    "selected": {
      "marker": {
        "size": 8
      }
    },
    "textfont": {
      "size": 10
    },
    "textposition": "top center",
    "type": "scatter3d"
  }
}
```

These settings are not comprehensive; other options are available in the API. 

You can also adjust these settings for customization. For example, if you want to rename the X-axis title, replace the value under *"layout" > "xaxis" > "title"* to the label you wish to display.

It's very important that whatever value is in the configuration text area be a valid JSON string. The **Validate** button will verify that the configuration is valid JSON, but not validate it is syntactically correct. This must be clicked before saving the configuration. Once validated, click the **Save** button to display the chart.
 
Once the chart is rendered, the configuration can be modified as well. Just double-click in the center of the chart area to display the current configuration.  

## Using the 3D Scatter Plot

Once the chart is configured and has data provided it will render a 3D representation of your data. Click and drag anywhere in the plot area to rotate the visualization in three dimensions. 

## More information about Mods for TIBCO Spotfire®

- [Spotfire® Mods on the TIBCO Community Exchange](https://community.tibco.com/exchange): A safe and trusted place to discover ready-to-use Mods
- [Spotfire® Mods Developer Documentation](https://tibcosoftware.github.io/spotfire-mods/docs/): Introduction and tutorials for Mods Developers
- [Spotfire® Mods by TIBCO Spotfire®](https://github.com/TIBCOSoftware/spotfire-mods/releases/latest): A public repository for example projects


© Copyright 2020. TIBCO Software Inc.