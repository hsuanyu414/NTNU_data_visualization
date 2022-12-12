var slider = document.getElementById("myRange");
var year_output = document.getElementById("year");
var checkbox = document.getElementById("demoCheckbox");
year_output.innerHTML = slider.value; // Display the default slider value
var mouseX = 0, mouseY = 0;

/* GLOBAL VARIABLE */
let cause_of_death_names = [];
let country_code = []
var selected_year = 1990;
var selected_cod = "All";
var selected_country_code = "All";
var selected_ratio = false;
var color_now = "gray";
var click_on_map = false;
var on_map_country_code = "All";

let BAR_CHART = {}

var year = document.getElementById("year").innerHTML;
// Update the current slider value (each time you drag the slider handle)

csv_array = []

/* MAIN FUNCTION */
cod_csv = d3.csv("cause_of_deaths.csv", (row) => {
    if (!country_code.includes(row.Code)) {
        country_code.push(row.Code);
    }
    return row;

})
 

var cod_options = ["All","Meningitis","Alzheimer's Disease and Other Dementias","Parkinson's Disease","Nutritional Deficiencies","Malaria","Drowning","Interpersonal Violence","Maternal Disorders","HIV/AIDS","Drug Use Disorders","Tuberculosis","Cardiovascular Diseases","Lower Respiratory Infections","Neonatal Disorders","Alcohol Use Disorders","Self-harm","Exposure to Forces of Nature","Diarrheal Diseases","Environmental Heat and Cold Exposure","Neoplasms","Conflict and Terrorism","Diabetes Mellitus","Chronic Kidney Disease","Poisonings","Protein-Energy Malnutrition","Road Injuries","Chronic Respiratory Diseases","Cirrhosis and Other Chronic Liver Diseases","Digestive Diseases","Fire, Heat, and Hot Substances","Acute Hepatitis"];
// var cod_color
var rainbow = d3.scaleSequential(d3.interpolateRainbow).domain([0, 31]);
var cod_color = []
cod_color.push("gray")
for(let i=0; i<31; i++)
    cod_color.push(rainbow(i))
// console.log(cod_color)



map_worldJson = d3.json("worldMap.json")
let map_margin = {top: 100, right: 20, bottom: 20, left: 20},
    map_width = 1200 - map_margin.left - map_margin.right,
    map_height = 600 - map_margin.top - map_margin.bottom;



/* BAR CHART DATA PROCESSING FUNCTION */
cod_csv.then((data) => {  
    slider.addEventListener("mouseup", () => {
        updateBarChart(getCODDeathCountByYear(data, slider.value, selected_country_code));
    });

    drawBarChart(getCODDeathCountByYear(data, slider.value));
});


function getCODDeathCountByYear(data, year, code="All") {
    if (data.filter((d) => d.Code == code).length == 0 && code != "All") {
        code = undefined;
    }
    const cause_of_death_names = cod_options.filter(cod => cod != "All");
    data = data.filter(d => (d.Code == code || code == "All"));
    return cause_of_death_names.map((cod) => {
        return {
            cause_of_death: cod,
            death_count: data.reduce((sum, current_value) => {
                return current_value["Year"] == year ? sum + parseInt(current_value[cod]) : sum + 0;
            }, 0),
        }
    })
}


/* LINE CHART DATA PROCESSING FUNCTION */
cod_csv.then((data) => {
    /*SHARED GLOBAL VARIABLE*/
    var t = d3.transition().duration(750).delay(100);
    checkbox.onchange = function() {
        selected_ratio = this.checked;
        console.log("checkbox_change: "+this.checked)
        changeLineChart(selected_cod, selected_country_code);
        updateBarChart(getCODDeathCountByYear(data, slider.value, selected_country_code));
    }

    slider.oninput = function() {
        year_output.innerHTML = this.value;
        selected_year = this.value;
        
    }
    
    slider.addEventListener("mouseup", changeMap);
    slider.addEventListener("keyup", changeMap);
      // only update the variable here and renew the d3 chart while mouse up on slider
    slider.onmouseup = function() {
        console.log("slide_change: "+selected_year)
        // changeMap();
    }
    slider.onkeyup = function() {
        console.log("slide_change: "+selected_year)
        // changeMap();
    }
    /* INITIALIZE COD SELECTOR */
    const causeOfDeathSelector = document.getElementById("cause-of-death-selector");
    for (let i = 0; i < cod_options.length; ++i) {
        const option = document.createElement("option");
        option.text = cod_options[i];
        option.value = cod_options[i];
        causeOfDeathSelector.appendChild(option);
    }

    // COD selector
    var causeOfDeath_output = document.getElementById("cause-of-death");
    causeOfDeath_output.innerHTML = causeOfDeathSelector.value;
    causeOfDeathSelector.oninput = function() {
        causeOfDeath_output.innerHTML = this.value;
        console.log("select COD: "+this.value)
        selected_cod = this.value;
        color_now = cod_color[cod_options.indexOf(selected_cod)]
        changeLineChart(selected_cod, selected_country_code);
        changeMap(color_now);
    }

    let map_paths;
    let map_death_ratio = {};
    initMap(data);
    function initMap(cod_data){
        // map part
        let map_svg = d3.select("#worldMap")
            .append("g")
            .attr("class", "map")
            let map_projection ;
            map_worldJson.then(drawWorld);
        function drawWorld(us){    
            map_projection = d3.geoEquirectangular()
                .fitExtent([[0, 0], [map_width, map_height]], us);
        let map_geoGenerator = d3.geoPath()
            .projection(map_projection);
        let i = 0;
        
        
        map_paths = map_svg.append("g").attr("id", "map_data")
            .selectAll('path')
            .data(us.features)
            .enter().append('path')
            .attr("stroke", "#000000")
            .attr("fill", cod_color[0])
            .attr("opacity", 1)
            .attr("d", map_geoGenerator)
            .on("mouseover", function(d){
                d3.select(this).attr("stroke-width", "2px")
            })
            .on("mouseout", function(d){
                d3.select(this).attr("stroke-width", "1px")
            })
            .on("click", function(d){
                click_on_map = true;
                selected_country_code = d.properties.adm0_iso;
                console.log("select country: "+selected_country_code)
                changeLineChart(selected_cod, selected_country_code);
                updateBarChart(getCODDeathCountByYear(data, slider.value, selected_country_code));
            })
        
        map_base = map_svg.append("g").attr("id", "map_base")
            .selectAll('path')
            .data(us.features)
            .enter().append('path')
            .attr("stroke", "#000000")
            .attr("fill", "none")
            .attr("d", map_geoGenerator)

        // map_svg.on("mouseover", function(d){
        //     mouseX = d3.event.clientX;
        //     mouseY = d3.event.clientY;
        //     d3.tip.offset([mouseY-30, mouseX-100])
        //     console.log(mouseX, mouseY)
        // })

        d3.tip = d3.tip().attr('class', 'd3-tip-map')
            .html(function(d) {
                let found = false;
                let ret_str = d.properties.name_long;
                for (let i = 0; i < cod_data.length; ++i) {
                    if (cod_data[i].Code == d.properties.adm0_iso && cod_data[i].Year == selected_year) {
                        found = true;
                        ret_str += "<br>Death Count: " + cod_data[i][selected_cod];
                        ret_str += "<br>Death Ratio: "+ formatAsPercent(100*cod_data[i][selected_cod]/cod_data[i]["All"]);
                        break;
                    }
                    found = false;
                }

                if(!found){
                    return d.properties.name_long+"<br>data not found"
                }
                else{
                    found = false;
                    return ret_str;
                }
                })
            .direction('abs')
            
            map_paths.on('mouseover', function(d) {
                d3.tip.show(d);
                d3.select(".d3-tip-map")
                .style("left", (d3.mouse(this)[0] + 15) + "px")
                .style("top", (d3.mouse(this)[1] + 15) + "px");
                on_map_country_code = d.properties.adm0_iso;
                map_base.attr("stroke-width", function(d){
                    if(d.properties.adm0_iso == on_map_country_code)
                        return "3px"
                    else
                        return "1px"
                })
                    
            })
            map_paths.on('mousemove', function(d){
                d3.select(".d3-tip-map")
                .style("left", (d3.mouse(this)[0] + 15) + "px")
                .style("top", (d3.mouse(this)[1] + 15) + "px");
            })
            map_paths.on('mouseout', function(d){
                d3.tip.hide(d)
                map_base.attr("stroke-width", "1px")
            })
            map_svg.call(d3.tip);
        }

        d3.select("#worldMap").on("click", function(d){
            if(click_on_map)
                click_on_map = false;
            else{
                selected_country_code = "All";
                console.log("select country: "+selected_country_code)
                changeLineChart(selected_cod, selected_country_code);
                updateBarChart(getCODDeathCountByYear(data, slider.value, selected_country_code));
            }
        })
    }

    
    function changeMap(){
        map_death_ratio = {};
        data.forEach((row) => {
            if (row.Year == selected_year){
                map_death_ratio[row["Code"]] = parseInt(row[selected_cod])/parseInt(row["All"]);              
            }
        })


        ratioScale = d3.scaleLinear()
            .domain([d3.min(Object.values(map_death_ratio))*0,
                     d3.max(Object.values(map_death_ratio))])
            .range([0, 1]);

        map_paths.transition(t)
            .attr("fill", function(d){
                if (map_death_ratio[d.properties.adm0_iso] != undefined)
                    return cod_color[cod_options.indexOf(selected_cod)]
                else
                    return "gray"
            })
            .attr("opacity", function(d){
                if (map_death_ratio[d.properties.adm0_iso] != undefined)
                    return ratioScale(map_death_ratio[d.properties.adm0_iso])
                else
                    return 0
            })
        
    }

    // set the dimensions and margins of the graph
    let death_count = {};
    let linechart_margin = {top: 10, right: 80, bottom: 30, left: 80},
        linechart_width = 800 - linechart_margin.left - linechart_margin.right,
        linechart_height = 500 - linechart_margin.top - linechart_margin.bottom;
    var linechartYasis, linechartLines, linechartLinesArea, linechartCircles, x, y, linechartLines, linechartLinesAreaBase, linechartCirclesBase, linechartXaxis, linechartYaxis, linechartXaxisGroup, linechartYaxisGroup, linechartSvg, linechartSvgGroup, linechartSvgAreaGroup, linechartSvgLineGroup, linechartSvgCircleGroup;
    var yearParse = d3.timeParse("%Y");
    //global variable for linechart
    initLineChart(selected_cod, selected_country_code);
    function initLineChart(cod, country_code){
        death_count = {};
        death_count_ratio = {};
        devide = country_code=='All'? 204:1 ;
        data.forEach((row) => {
            if(row.Code != country_code && country_code != "All")
                return;
            
            if(row.Year in death_count){
                death_count[row["Year"]] += parseInt(row[cod]);
                death_count_ratio[row["Year"]] += parseInt(row[cod])*100/(parseInt(row["All"])*devide);
            }
            else{
                death_count[row["Year"]] = parseInt(row[cod]);
                death_count_ratio[row["Year"]] = parseInt(row[cod])*100/(parseInt(row["All"])*devide);
            }
        })
        
        
        // append the svg object to the body of the page
        let linechart_svg = d3.select("#linechart")
            .append("svg")
            .attr("width", linechart_width + linechart_margin.left + linechart_margin.right)
            .attr("height", linechart_height + linechart_margin.top + linechart_margin.bottom)
            .append("g")
            .attr("transform","translate(" + linechart_margin.left + "," + linechart_margin.top + ")");

        // Add X axis --> it is a date format
        x = d3.scaleTime()
            .domain(d3.extent(Object.keys(death_count), (d) => yearParse(d)))
            .range([ 0, linechart_width ]);
        linechartXasis = linechart_svg.append("g")
            .attr("transform", "translate(0," + linechart_height + ")")
            .call(d3.axisBottom(x));

        if(selected_ratio)
            selected_dict = death_count_ratio;
        else
            selected_dict = death_count;

        // Add Y axis
        ratio_max = d3.max(Object.values(selected_dict))
        ratio_min = d3.min(Object.values(selected_dict))
        ratio_median = d3.mean(Object.values(selected_dict))
        ratio_offset = ratio_median*0.3
        y = d3.scaleLinear()
        .domain(
            [Math.max(0, ratio_min-ratio_offset), 
             Math.min(ratio_max+ratio_offset, 100+(selected_ratio==false? Infinity:0))])
        .range([ linechart_height, 0 ]);


        linechartYasis = linechart_svg.append("g").attr("color", cod_color[cod_options.indexOf(cod)])
        .attr("class", "line_chart_yaxis")
        .call(d3.axisLeft(y));

        
        //Baseline
        
        data_ = Object.keys(selected_dict).map((year) => {
            return {
                year: yearParse(year),
                value: selected_dict[year],
            }
        }
        )
        
        // Add the line
        linechartLines = linechart_svg.append("path")
        .datum(data_)
        .attr("fill", "none")
        .attr("class", "line_chart_line")
        .attr("stroke", cod_color[cod_options.indexOf(cod)])
        .attr("stroke-width", 2)
        .attr("d", d3.line()
            .x((d) => x(d.year))
            .y((d) => y(d.value))
        )
        linechartLinesArea = linechart_svg.append("path")
        .datum(data_)
        .attr("fill", cod_color[cod_options.indexOf(cod)])
        .attr("opacity", 0.2)
        .attr("class", "line_chart_line")
        .attr("d", d3.area()
            .x((d) => x(d.year))
            .y0(linechart_height)
            .y1((d) => y(d.value))
        )

        linechartCircles = linechart_svg.selectAll("circle")
        .data(data_)
            .enter().append("circle")
            .attr("fill", cod_color[cod_options.indexOf(cod)])
            .attr("cx", function(d) { return x(d.year) })
            .attr("cy", function(d) { return y(d.value) })
            .attr("r", 0)
        
        // // Add the line
        // linechartLinesBase = linechart_svg.append("path")
        // .datum(data_)
        // .attr("fill", "none")
        // .attr("class", "line_chart_line")
        // .attr("stroke", cod_color[cod_options.indexOf(cod)])
        // .attr("stroke-width", 2)
        // .attr("d", d3.line()
        //     .x((d) => x(d.year))
        //     .y((d) => y(d.death_count))
        // )

        

        // linechartLinesAreaBase = linechart_svg.append("path")
        // .datum(data_)
        // .attr("fill", cod_color[cod_options.indexOf(cod)])
        // .attr("opacity", 0.2)
        // .attr("class", "line_chart_line")
        // .attr("d", d3.area()
        //     .x((d) => x(d.year))
        //     .y0(linechart_height)
        //     .y1((d) => y(d.death_count))
        // )
        
    }
    
    function changeLineChart(cod, country_code){
        death_count = {};
        death_count_total = {};
        death_count_ratio = {};
        devide = country_code=='All'? 204:1 ;
        data.forEach((row) => {
            if(row.Code != country_code && country_code != "All")
                return;
            if(row.Year in death_count){
                death_count[row["Year"]] += parseInt(row[cod]);
                death_count_total[row["Year"]] += parseInt(row["All"]);
                }
            else{
                death_count[row["Year"]] = parseInt(row[cod]);
                death_count_total[row["Year"]] = parseInt(row["All"]);
                }
        })
        for (const [key, value] of Object.entries(death_count)) {
            death_count_ratio[key] = value*100/death_count_total[key];
        }
        
        // Add Y axis
        if(selected_ratio)
            selected_dict = death_count_ratio;
        else
            selected_dict = death_count;

        ratio_max = d3.max(Object.values(selected_dict))
        ratio_min = d3.min(Object.values(selected_dict))
        ratio_median = d3.mean(Object.values(selected_dict))
        ratio_offset = ratio_median*0.3
            y.domain(
                [Math.max(0, ratio_min-ratio_offset), 
                 Math.min(ratio_max+ratio_offset, 100+(selected_ratio==false? Infinity:0))])


        linechartYasis.transition(t).attr("color", cod_color[cod_options.indexOf(cod)]).call(d3.axisLeft(y));

        // Add the line
        data_ = Object.keys(selected_dict).map((year) => {
            return {
                year: yearParse(year),
                value: selected_dict[year],
            }})

        linechartLines
            .datum(data_).transition(t)
            .attr("stroke", cod_color[cod_options.indexOf(cod)])
            .attr("d", d3.line()
                .x((d) => x(d.year))
                .y((d) => y(d.value))
        )
        linechartLinesArea
        .datum(data_).transition(t)
        .attr("fill", cod_color[cod_options.indexOf(cod)])
        .attr("d", d3.area()
            .x((d) => x(d.year))
            .y0(linechart_height)
            .y1((d) => y(d.value))
        )

        linechartCircles
        .data(data_).transition(t)
            .attr("fill", cod_color[cod_options.indexOf(cod)])
            .attr("cx", function(d) { return x(d.year) })
            .attr("cy", function(d) { return y(d.death_count) })
    }
    
})


/* DRAW BAR CHART */
function drawBarChart(data) {
    data.sort((a, b) => b.death_count - a.death_count);
    max_death_count = Math.max(...data.map(d => d.death_count));

    // set the dimensions and margins of the graph
    const margin = {top: 20, right: 30, bottom: 0, left: 30},
        width = 900 - margin.left - margin.right,
        height = 1200 - margin.top - margin.bottom;
    
    // append the svg object to the body of the page
    const svg = d3.select("#barchart")
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");
    
    // Add X axis
    const x = d3.scaleLinear()
    .domain([0, max_death_count])
    .range([0, width]);
    const xAxis = d3.select("#x-axis")
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", 60)
    .append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisBottom(x))
    
    xAxis.selectAll("text")
    .attr("transform", "translate(-10,0) rotate(-45)")
    .style("text-anchor", "end");

    // Y axis
    const y = d3.scaleBand()
    .range([0, height])
    .domain(data.map(d => { return `${d.cause_of_death} (${d.death_count})`}))
    .padding(.1);  

    svg.selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", x(0) + 1)
    .attr("y", d => y(`${d.cause_of_death} (${d.death_count})`))
    .attr("width", d => x(d.death_count))
    .attr("height", y.bandwidth())
    .attr("fill", d => cod_color[cod_options.indexOf(d.cause_of_death)])

    const yAxis = svg.append("g")
    .call(d3.axisRight(y))
    yAxis.selectAll(".tick text")
    .attr("transform", `translate(10, 0)`)

    BAR_CHART = {
        svg: svg,
        x: x,
        y: y,
        xAxis: xAxis,
        yAxis: yAxis,
        width: width,
        height: height,
    }
}

function updateBarChart(data) {
    const svg = BAR_CHART.svg;
    const x = BAR_CHART.x;
    const y = BAR_CHART.y;
    const xAxis = BAR_CHART.xAxis;
    const yAxis = BAR_CHART.yAxis;
    const height = BAR_CHART.height;

    if (checkbox.checked) {
        const total_death_count = data.reduce((sum, current_value) => {
            return sum + current_value.death_count;
        }, 0);

        data.forEach((d, index) => {
            data[index] = {
            cause_of_death: d.cause_of_death,
            death_count: total_death_count === 0 ? 0 : d.death_count / total_death_count * 100,
        }})
    }

    data.sort((a, b) => b.death_count - a.death_count);
    max_death_count = Math.max(...data.map(d => d.death_count));

    // Update the X axis
    x.domain([0, max_death_count]);
    xAxis.transition().duration(1000).call(d3.axisBottom(x));

    xAxis.selectAll("text")
    .attr("transform", "translate(-10,0) rotate(-45)")
    .style("text-anchor", "end");

    // Update the Y axis
    y.domain(data.map((d) => `${d.cause_of_death} (${checkbox.checked ? formatAsPercent(d.death_count) : d.death_count})`));
    yAxis.transition().duration(1000).call(d3.axisRight(y));

    // Update the Bars
    const u = svg.selectAll("rect")
    .data(data)
    
    u.enter()
    .append("rect")
    .merge(u)
    .transition()
    .duration(1000)
        .attr("x", x(0) + 1)
        .attr("y", d => y(`${d.cause_of_death} (${checkbox.checked ? formatAsPercent(d.death_count) : d.death_count})`))
        .attr("width", d => {return (max_death_count == 0 ? 0 : x(d.death_count))})
        .attr("height", y.bandwidth())
        .attr("fill", d => cod_color[cod_options.indexOf(d.cause_of_death)])
}

function formatAsPercent(num) {
    return new Intl.NumberFormat('default', {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num / 100);
}