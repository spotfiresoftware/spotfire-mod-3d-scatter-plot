// @ts-nocheck
Spotfire.initialize(async function(mod) {
    // Get the visualization element
    const vizElem = document.querySelector(".visualization"); // Plotly target
    
    // Get the render context
    const context = mod.getRenderContext();



    // --------------------------------------------------------------------------------
    // SPOTFIRE DEFINITIONS
    let rows = null;
    let axes = {};
    let windowSize = null;

    // --------------------------------------------------------------------------------
    // PLOTLY DATA AND CONFIG
    let data = [];
    let traces = {};
    let plotlyConfigTemplate = null; // exact copy from config
    let plotlyConfig = null; // values passed to plotly


    // --------------------------------------------------------------------------------
    // DATA FUNCTIONS
    // Deep clones an object, kind of
    let clone = function(aObject) {
        if (!aObject) {
            return aObject;
        }

        let v;
        let bObject = Array.isArray(aObject) ? [] : {};
        for (const k in aObject) {
			v = aObject[k];
			bObject[k] = (typeof v === "object") ? clone(v) : v;
        }

        return bObject;
    }

    // Processes a raw data value
    let processData = function(val) {
        // Value is a string
        if(typeof val === "string" || val instanceof String) {
            // Value length is 0, set it to null to make Plotly happy
            if(val.length == 0)
                return null;
            // Is a date, then parse value into a Date object
            else if(val.includes("Date"))
                return new Date(parseInt(val.substr(6)));
            // Otherwise return the value
            else
                return val;
        }
        // Other value types
        else {
            // Just return the value
            return val;
        }
    }

    // Tests if value is a date
    let isDate = function(val) {
        if((typeof val === "string" || val instanceof String) && val.length > 0 && val.includes("Date"))
            return true;
        return false;
    }

    // Creates a new trace object
    let createTrace = function(name, color) {
        if(plotlyConfig == null) return;
        let trace = null;
        if(plotlyConfig[name] != null)
            trace = clone(plotlyConfig[name]);
        else
            trace = clone(plotlyConfig.defaultTrace);
        trace.name = name;
        resetTraceData(trace);

        // Set axis colors if enabled
        if(plotlyConfig.options.setXAxisColors == true) {   
            setTraceAxisColor('x', trace.xaxis, color);        
        }
        if(plotlyConfig.options.setYAxisColors == true) {   
            setTraceAxisColor('y', trace.yaxis, color);        
        }
        if(plotlyConfig.options.setZAxisColors == true) {   
            setTraceAxisColor('z', trace.zaxis, color);        
        }

        return trace;
    }

    // Resets the data arrays in the trace
    let resetTraceData = function(trace) {
        trace._prevSelected = trace.selectedpoints != null && trace.selectedpoints.length > 0;
        trace.x = [];
        trace.y = [];
        trace.z = [];
        trace.selectedpoints = [];
        trace._rows = [];
    }

    // Sets the trace axis color
    let setTraceAxisColor = function(axis, target, color) {
        let axisName = axis + "axis";
        let axisContainer = plotlyConfig.layout.scene;
        if(target != null) {
            axisName = axisName + target.substr(1,1);
            axisContainer[axisName].linecolor = color;
        }
        else {
            axisContainer[axisName].linecolor = color;
        }
    }

    // Returns the trace for the given key. If not found, then it will create one.
    let getTrace = function(key, name, color) {
        let trace = traces[key];
        if(trace == null) {            
            trace = createTrace(name, color);
            traces[key] = trace;
            data.push(trace);
        }
        return trace;
    }

    // Processes all rows in a set
    let processRows = function() {
        if(plotlyConfig == null) return;
        if(rows == null) return;

        // Reset arrays
        for(let traceName in traces) {
            let trace = traces[traceName];
            resetTraceData(trace);
        }

        // Iterate over rows and push into arrays
        let initAxes = false;
        rows.forEach(function(row) {
            // Get values
            let x = row.continuous("X").value();
            let y = row.continuous("Y").value();
            let z = row.continuous("Z").value();
            let lineBy;
            if(axes["Line by"] != undefined && axes["Line by"].expression != '<>')
                lineBy = row.categorical("Line by").formattedValue();
            else
                lineBy = '1';
            let color = row.color().hexCode;

            // Set axis types based on first row of data, this will detect dates
            if(initAxes == false) {
                setAxes(x, y, z);
                initAxes = true;
            }

            // Get the trace, this will create one if not found
            let trace = getTrace(lineBy, lineBy, color);

            // Push the row reference into the trace
            trace._rows.push(row);

            // Push data into the trace
            trace.x.push(processData(x));
            trace.y.push(processData(y));
            trace.z.push(processData(z));

            if(row.isMarked() == true) {
                trace.selectedpoints.push(trace._rows.length - 1);
                if(trace.selected != null)
                    trace.selected.marker.color = row.color().hexCode;
            }
            else
                trace.marker.color = row.color().hexCode;       
                
        });
    }

    // Format tooltip text
    let formatTooltipText = function(text) {
        return text.replace("<", "").replace(">", "").replace("[", "").replace("]", "");
    }

    // --------------------------------------------------------------------------------
    // PLOTLY ACTIONS
    // Replot the data on a chart
    let replotChart = function() {
        //console.log('replot');
        if(plotlyConfig == null) return;
        Plotly.react(vizElem, data, plotlyConfig.layout, plotlyConfig.options);
    }

    // Draw or redraw the entire chart
    let drawChart = function() {
        //console.log('draw');
        if(plotlyConfig == null) return;   
        Plotly.newPlot(vizElem, data, plotlyConfig.layout, plotlyConfig.options);    

        // Change the pointer to default to match Spotfire behaviour
        let dragLayer = document.getElementsByClassName('nsewdrag')
        for(let idx = 0; idx < dragLayer.length; idx++)
            dragLayer[idx].style.cursor = 'default';

        // Add chart event handlers
        addChartEventHandlers();
   }

   // Append chart event handlers
   let addChartEventHandlers = function() {
        // Add click event
        /*vizElem.on('plotly_click', function(eventData) {
            console.log('click');
            console.log(eventData);
        });*/      

        // Add hover event
        vizElem.on('plotly_hover', function(eventData){
            let text = '';
            for(let idx = 0; idx < eventData.points.length; idx++) {
                if(eventData.points[idx].data.name != "1")
                    text = text + formatTooltipText(axes["Line by"].expression) + ": " + eventData.points[idx].data.name + "\n";
                text = text + formatTooltipText(axes["X"].expression) + ": " + eventData.points[idx].x + "\n";
                text = text + formatTooltipText(axes["Y"].expression) + ": " + eventData.points[idx].y + "\n";
                text = text + formatTooltipText(axes["Z"].expression) + ": " + eventData.points[idx].z + "\n";
            }
            mod.controls.tooltip.show(text, 500);
        });

        // Add unhover event
        vizElem.on('plotly_unhover', function(eventData){
            mod.controls.tooltip.hide();
        });

        // Add selected event
        vizElem.on('plotly_selected', function(eventData) {
            if(eventData != null) {
                for(let idx = 0; idx < eventData.points.length; idx++) {
                    let point = eventData.points[idx];
                    let trace = data[point.curveNumber];
                    let row = trace._rows[point.pointNumber];
                    row.mark();
                }
            }
        });    
   }

    // Set plotly axis to date type
    let plotlyAxisToDate = function(template) {
        // Clone the template axis
        let newAxis = clone(template);

        // Change the type to date and remove any tickformat
        newAxis.type = "date";
        delete newAxis.tickformat;

        return newAxis;
    }

    // Set plotly axis to non-date
    let plotlyAxisToNonDate = function(template) {
        // Clone the template axis
        return clone(template);
    }
    
    // Set axes types based on data values
    let setAxes = function(x, y, z) {
        // Check x data to see if it's a date
        const xIsDate = isDate(x);
        let axisContainer = plotlyConfig.layout.scene;
        let axisTemplateContainer = plotlyConfigTemplate.layout.scene;

        // If it is a date and the xaxis type is not date, then switch the xaxis
        //   to a date type using the plotlyConfigTemplate definition for xaxis
        if(xIsDate == true && axisContainer.xaxis.type != 'date') {
            //console.log("x -> date");
            axisContainer.xaxis = plotlyAxisToDate(axisTemplateContainer.xaxis);
        }
        // If it is not a date and the xaxis type is a date, then switch the xaxis
        //   to the default using the plotlyConfigTemplate definition for xaxis
        else if(xIsDate == false && axisContainer.xaxis.type == 'date') {
            //console.log("x -> nondate");
            axisContainer.xaxis = plotlyAxisToNonDate(axisTemplateContainer.xaxis);
        }

        // Check y data to see if it's a date
        const yIsDate = isDate(y);

        // If it is a date and the yaxis type is not date, then switch the yaxis
        //   to a date type using the plotlyConfigTemplate definition for yaxis
        if(yIsDate == true && axisContainer.yaxis.type != 'date') {
            //console.log("y -> date");
            axisContainer.yaxis = plotlyAxisToDate(axisTemplateContainer.yaxis);
        }
        // If it is not a date and the yaxis type is a date, then switch the yaxis
        //   to the default using the plotlyConfigTemplate definition for yaxis
        else if(yIsDate == false && axisContainer.yaxis.type == 'date') {
            //console.log("y -> nondate");
            axisContainer.yaxis = plotlyAxisToNonDate(axisTemplateContainer.yaxis);
        }

        // Check z data to see if it's a date
        const zIsDate = isDate(z);

        // If it is a date and the zaxis type is not date, then switch the zaxis
        //   to a date type using the plotlyConfigTemplate definition for zaxis
        if(zIsDate == true && axisContainer.zaxis.type != 'date') {
            //console.log("z -> date");
            axisContainer.zaxis = plotlyAxisToDate(axisTemplateContainer.zaxis);
        }
        // If it is not a date and the zaxis type is a date, then switch the yaxis
        //   to the default using the plotlyConfigTemplate definition for zaxis
        else if(zIsDate == false && axisContainer.zaxis.type == 'date') {
            //console.log("z -> nondate");
            axisContainer.zaxis = plotlyAxisToNonDate(axisTemplateContainer.zaxis);
        }


        // Reset autorange, plotly bug, sometimes reset to "true"
        axisContainer.xaxis.autorange = axisTemplateContainer.xaxis.autorange;
        axisContainer.yaxis.autorange = axisTemplateContainer.yaxis.autorange;
        axisContainer.zaxis.autorange = axisTemplateContainer.zaxis.autorange;
    }


    // --------------------------------------------------------------------------------
    // UI EVENT HANDLERS

    // Register event handler on the viz element to remove selection
    vizElem.onclick = function() {
        for(let traceName in traces) {
            let trace = traces[traceName];
            let selectedpoints = [...trace.selectedpoints];
            for(let idx = 0; idx < selectedpoints.length; idx++) {
                let selectedpoint = trace.selectedpoints[idx];
                let row = trace._rows[selectedpoint];
                row.mark("Toggle");
            }
        }
    }



    // --------------------------------------------------------------------------------
    // CONFIGURATION
    // Updates the configuration in the property store, this will trigger a redraw
    let updateConfig = function(config) {
        mod.property("plotly-config").set(config);
    }

    // Get the configuration handler
    //   document - the HTML document
    //   drawChart - function to call when toggling to visualization mode, this
    //     will redraw the Plotly chart due to changes in div sizing
    //   updateConfig - function to call when dialog saves the configuration
    const vizConfiguration = new VizConfiguration(document, drawChart, updateConfig);
    


    // --------------------------------------------------------------------------------
    // DATA EVENT HANDLER
    // Create a read function for axes and data changes
    let readData = mod.createReader(
        mod.visualization.axis("Order by"), 
        mod.visualization.axis("Line by"), 
        mod.visualization.axis("X"), 
        mod.visualization.axis("Y"),
        mod.visualization.axis("Z"),
        mod.visualization.data(),
        mod.windowSize()
    );

    // Call the read function to schedule an onChange callback (one time)
    readData.subscribe(async function onChange(orderByView, lineByView, xAxisView, yAxisView, zAxisView, dataView, windowSizeView) {
        // Set axes
        axes[orderByView.name] = orderByView;
        axes[lineByView.name] = lineByView;
        axes[xAxisView.name] = xAxisView;
        axes[yAxisView.name] = yAxisView;
        axes[zAxisView.name] = zAxisView;

        // Get all rows and process
        rows = await dataView.allRows();            
        processRows();

        // Replot chart
        replotChart();

        // Check window size change and redraw
        if(windowSize == null || windowSizeView != windowSize ) {
            windowSize = windowSizeView;
            drawChart();
        }

        // Complete render
        context.signalRenderComplete();
    });


    


    // Create a read function for plotly-config
    let readPlotlyConfig = mod.createReader(
        mod.property("plotly-config")
    );
    
    // Call the read function to schedule an onChange callback (one time)
    readPlotlyConfig.subscribe(async function onChange(config) {
        var configValue = config.value();

        // Update the configuration in the configuration handler
        vizConfiguration.setConfiguration(configValue);
        
        if(config != null && configValue != null && configValue.length > 0)  {
            // This is the exact configuration from the config panel
            plotlyConfigTemplate = JSON.parse(configValue);

            // This is the configuration that will be passed to Plotly
            plotlyConfig = JSON.parse(configValue);

            // console.log("PLOTLY CONFIG");
            // console.log(plotlyConfig);
            
            // Reset the data
            data = [];
            traces = {};

            // Reprocess the rows and draw the chart with updated configuration
            processRows();
            drawChart();
        }

        // Complete render
        context.signalRenderComplete();
    });

}); // end Spotfire


// Class to manage visualization configuration
class VizConfiguration {
    constructor(document, onDisplayViz, onChangeConfig) {
        let self = this;

        // Set properties
        this.configuration = null;
        this.onDisplayViz = onDisplayViz;
        this.onChangeConfig = onChangeConfig;
    
        // Elements
        this.contentElem = document.querySelector(".content");
        this.vizElem = this.contentElem.querySelector(".visualization");
        this.configElem = this.contentElem.querySelector(".configuration");
        this.validationTextElem = this.configElem.querySelector(".validation");
        this.configTextArea = this.configElem.querySelector("textarea");
        this.noConfigElem = this.contentElem.querySelector(".no-config");
    
        
        // Event handler on configuration icon
        document.querySelector("div.content").ondblclick = function() {
            self.viewConfiguration();
            return false;
        };
    
        // Event handler on validate button
        this.configElem.querySelector("button.validate").onclick = function() {
            var valid = self.validateConfiguration(self.configTextArea.value);
            self.configElem.querySelector("button.save").disabled = !valid;
        };
    
        // Event handler on cancel button
        this.configElem.querySelector("button.cancel").onclick = function() {
            self.configTextArea.value = '';
            self.setDisplayState();
        };
    
        // Event handler on save button
        this.configElem.querySelector("button.save").onclick = function() {
            if(self.onChangeConfig != null)
                onChangeConfig(self.configTextArea.value)
        };
    
        // Set initial display state
        this.setDisplayState();    
    }

    // Set the configuration value and update display state
    setConfiguration(configuration) {
        this.configuration = configuration;
        this.setDisplayState();
    }

    // Sets the display state 
    setDisplayState() {
        if(this.configuration == null || this.configuration.length == 0)
        this.viewNoConfiguration();
        else if(this.configuration.length > 0 ) {
            let valid = this.validateConfiguration(this.configuration);
            if(valid == true)
                this.viewVisualization();
            else
                this.viewConfiguration() 
        }
    }

    // Validates the specified configuration for JSON adherence
    validateConfiguration(config) {
        let thisConfig = config;
        if(thisConfig == null)
            thisConfig = '';
    
        try {
    
            JSON.parse(thisConfig);
            this.validationTextElem.innerHTML = "Valid";
            this.validationTextElem.classList.add('ok');
            this.validationTextElem.classList.remove('error');
            return true;
        }
        catch(err) {
            this.validationTextElem.innerHTML = err.message;
            this.validationTextElem.classList.remove('ok');
            this.validationTextElem.classList.add('error');
            return false;
        }
    }

    // Sets UI to No Configuration
    viewNoConfiguration() {
        this.vizElem.style.display = 'none';
        this.configElem.style.display = 'none';
        this.noConfigElem.style.display = 'flex';
    }

    // Sets UI to Configuration
    viewConfiguration() {
        this.configTextArea.value = this.configuration;
        this.validateConfiguration(this.configuration);
        this.configElem.querySelector("button.save").disabled = true;

        this.vizElem.style.display = 'none';
        this.configElem.style.display = 'flex';
        this.noConfigElem.style.display = 'none';
    }

    // Sets UI to Vizualization
    viewVisualization() {
        this.vizElem.style.display = 'flex';
        this.configElem.style.display = 'none';
        this.noConfigElem.style.display = 'none';

        if(this.onDisplayViz != null)
            this.onDisplayViz();
    }
}



