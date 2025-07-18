    const simplifiedDataWithResources = 
    [ 
        {
          "id": "1",
          "name": "Tulpen",
          "url": "",
          "taggings_count":	2,
          "places": [
            {
              "title": "Botanischer Garten",
              "tags": ["Tulpen", "Rosen", "Narzissen", "Nelken"]
            },
            {
              "title": "Stadtpark",
              "tags": ["Tulpen", "Wildblumen"]
            }
          ]
        },
        {
          "id": "2",
          "name": "Rosen",
          "url": "",
          "taggings_count":	2,
          "places": [
            {
              "title": "Botanischer Garten",
              "tags": ["Tulpen", "Rosen", "Narzissen", "Nelken"]
            },
            {
              "title": "Zentralfriedhof",
              "tags": ["Rosen", "Nelken"]
            }
          ]
        },   
        {
          "id": "3",
          "name": "Narzissen",
          "url": "",
          "taggings_count":	1,
          "places": [
            {
              "title": "Botanischer Garten",
              "tags": ["Tulpen", "Rosen", "Narzissen", "Nelken"]
            }
          ]
        },   
        {
          "id": "4",
          "name": "Nelken",
          "url": "",
          "taggings_count":	1,
          "places": [
            {
              "title": "Botanischer Garten",
              "tags": ["Tulpen", "Rosen", "Narzissen", "Nelken"]
            }
          ]
        }, 
        {
          "id": "5",
          "name": "Wildblumen",
          "url": "",
          "taggings_count":	1,
          "places": [
            {
              "title": "Stadtpark",
              "tags": ["Tulpen", "Wildblumen"]
            }
          ]
        },         
    ]

    function transformResourceDataToLinkData(resourceData) {
      const nodes = resourceData;
      console.log("Original Nodes:", nodes);
      const links = [];
      const linkMap = new Map(); // Um Duplikate zu vermeiden
      
      // Alle Knoten durchgehen
      nodes.forEach(node => {
        if (node.places) {
          node.places.forEach(resource => {
            // Für jede Resource die verbundenen Knoten verlinken
            resource.tags.forEach(targetNodeId => {
                console.log(`Processing resource: ${resource.title} with targetNodeId: ${targetNodeId}`);
              // Prüfen ob der Zielknoten existiert
              if (nodes.some(n => n.name === targetNodeId)) {
                // Eindeutigen Link-Schlüssel erstellen
                const linkKey = `${node.name}-${targetNodeId}`;
                const reverseLinkKey = `${targetNodeId}-${node.name}`;
                
                // Prüfen ob Link bereits existiert (in beide Richtungen)
                if (!linkMap.has(linkKey) && !linkMap.has(reverseLinkKey)) {
                  links.push({
                    source: node.name,
                    target: targetNodeId,
                    value: 1,
                    resource: resource.name
                  });
                  linkMap.set(linkKey, true);
                } else {
                  // Link-Stärke erhöhen wenn bereits vorhanden
                  const existingLink = links.find(l => 
                    (l.source === node.name && l.target === targetNodeId) ||
                    (l.source === targetNodeId && l.target === node.name)
                  );
                  if (existingLink) {
                    existingLink.value += 1;
                  }
                }
              }
            });
          });
        }
      });
      
      console.log("Transformed Links:", links);
      return {
        nodes: nodes,
        links: links
      };
    }

    // Daten transformieren
    // const sampleData = transformResourceDataToLinkData(simplifiedDataWithResources);

    class KnowledgeMap {
      constructor(data, containerId) {
        this.data = data;
        this.container = d3.select(`#${containerId}`);
        this.width = this.container.node().getBoundingClientRect().width;
        this.height = this.container.node().getBoundingClientRect().height;
        this.simulationActive = true;
        
        this.initialize();
      }
      
      initialize() {
        this.svg = this.container.append("svg")
          .attr("width", this.width)
          .attr("height", this.height);
          
        // Kraftsimulation erstellen
        this.simulation = d3.forceSimulation()
          .force("link", d3.forceLink().id(d => d.name).distance(100))
          .force("charge", d3.forceManyBody().strength(-300))
          .force("center", d3.forceCenter(this.width / 2, this.height / 2))
          .force("collision", d3.forceCollide().radius(50));
        
        this.createDefs();
        this.createLinks();
        this.createNodes();
        
        this.simulation
          .nodes(this.data.nodes)
          .on("tick", () => this.ticked());
        
        this.simulation.force("link")
          .links(this.data.links);
          
        d3.select("#resetBtn").on("click", () => this.resetPosition());
        d3.select("#toggleForceBtn").on("click", () => this.toggleForce());
          
        const zoom = d3.zoom()
          .scaleExtent([0.1, 8])
          .on("zoom", (event) => {
            this.svg.selectAll("g").attr("transform", event.transform);
          });
          
        this.svg.call(zoom);
      }
      
      createDefs() {
        this.svg.append("defs").selectAll("marker")
          .data(["end"])
          .enter().append("marker")
          .attr("id", d => d)
          .attr("viewBox", "0 -5 10 10")
          .attr("refX", 25)
          .attr("refY", 0)
          .attr("markerWidth", 6)
          .attr("markerHeight", 6)
          .attr("orient", "auto")
          .append("path")
          .attr("d", "M0,-5L10,0L0,5");
      }
      
      createLinks() {
        this.link = this.svg.append("g")
          .selectAll("path")
          .data(this.data.links)
          .enter().append("path")
          .attr("class", "link")
          .attr("stroke-width", d => Math.sqrt(d.value*130));
      }
      
      createNodes() {
        const nodeGroup = this.svg.append("g")
          .selectAll(".node")
          .data(this.data.nodes)
          .enter().append("g")
          .attr("class", "node")
          .call(this.drag(this.simulation));
          
        nodeGroup.append("circle")
          .attr("r", 2)
          .attr("fill", (d, i) => d3.schemeCategory10[i % 10]);
          
        // Text für die Knoten
        nodeGroup.append("text")
          .attr("dy", 0)
          .attr("text-anchor", "middle")
          .attr("fill", "black")
          .attr("font-size", d => {
            const size = 8 + (d.taggings_count ? d.taggings_count : 0);
            return Math.max(8, Math.min(size, 20)) + "px";
        })
          .text(d => d.name)
          .each(function(d) {
            d3.select(this)
              .append("tspan")
              .attr("baseline-shift", "super")
              .attr("font-size", "0.5em")
              .text(d.taggings_count);
          })
          
          .each(function(d) {
            const text = d3.select(this);
            const node = d3.select(this.parentNode);
            const bbox = this.getBBox();
            node.insert("rect", "text")
              .attr("x", bbox.x - 8)
              .attr("y", bbox.y - 4)
              .attr("width", bbox.width + 16)
              .attr("height", bbox.height + 8)
              .attr("rx", 5)
              .attr("ry", 5)
              .style("fill", "#cc0");
          });
          
        // Klick-Handler 
        /*
        nodeGroup.on("click", (event, d) => {
          window.open(d.url, "_blank");
        });
        */
        
        // Tooltips 
        /*
        nodeGroup.append("title")
        .text(d => {
        console.log("Node Data:", d.places);
        const resourceList = d.places ? 
            d.places.map(r => `${r.title}: ${r.tags.join(', ')}`).join('\n') : 
            'Keine Resources';
        return `${resourceList}`;
        });
        */

        const list = document.getElementById('list');
        // Knoten in der Liste anzeigen
        nodeGroup.on("mouseover", (event, d) => {
          // Liste leeren
          list.innerHTML = '';  
            // Knoteninformationen hinzufügen
            const nodeInfo = document.createElement('div');
            nodeInfo.className = 'node-info';
            nodeInfo.innerHTML = `
              <h3>${d.name} <small>(${d.taggings_count} Places)</small></h3>
              
              <ul>
                ${d.places ? d.places.map(r => `<li><p>${r.title}</p><small>${r.tags.join(', ')}</small></li>`).join('') : '<li>Keine Ressourcen</li>'}
              </ul>
            `;
            list.appendChild(nodeInfo);
        });
        
        this.node = nodeGroup;
      }
      
      // Funktion für die Aktualisierung der Positionen
      ticked() {
        // Kurvenförmige Verbindungen
        this.link.attr("d", d => {
          const dx = d.target.x - d.source.x,
                dy = d.target.y - d.source.y,
                dr = Math.sqrt(dx * dx + dy * dy) * 2;
          return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        });
        
        this.node.attr("transform", d => `translate(${d.x},${d.y})`);
      }
      
      // Drag-Funktionalität
      drag(simulation) {
        function dragstarted(event) {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          event.subject.fx = event.subject.x;
          event.subject.fy = event.subject.y;
        }
        
        function dragged(event) {
          event.subject.fx = event.x;
          event.subject.fy = event.y;
        }
        
        function dragended(event) {
          if (!event.active) simulation.alphaTarget(0);
          event.subject.fx = null;
          event.subject.fy = null;
        }
        
        return d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended);
      }
      
      // Position zurücksetzen
      resetPosition() {
        this.simulation.force("center", d3.forceCenter(this.width / 2, this.height / 2));
        this.simulation.alpha(1).restart();
        
        this.data.nodes.forEach(node => {
          node.fx = null;
          node.fy = null;
        });
      }
      
      // Kraftsimulation ein-/ausschalten
      toggleForce() {
        this.simulationActive = !this.simulationActive;
        
        if (this.simulationActive) {
          this.simulation.alphaTarget(0.3).restart();
        } else {
          this.simulation.alphaTarget(0).stop();
        }
      }
      
      // Funktion, um Daten zu aktualisieren
      updateData(newData) {
        this.data = newData;
        
        // SVG leeren und neu aufbauen
        this.svg.selectAll("*").remove();
        this.createDefs();
        this.createLinks();
        this.createNodes();
        
        // Simulation aktualisieren
        this.simulation.nodes(this.data.nodes);
        this.simulation.force("link").links(this.data.links);
        this.simulation.alpha(1).restart();
      }
    }

    // Erstellen der Knowledge Map
    // const knowledgeMap = new KnowledgeMap(sampleData, "graph");

    const loadingElement = document.getElementById('loading');
    // Funktion zum Laden externer Resource-based Daten
    function loadExternalResourceData(url) {
      fetch(url)
        .then(response => response.json())
        .then(resourceData => {
          const transformedData = transformResourceDataToLinkData(resourceData);
          const knowledgeMap = new KnowledgeMap(transformedData, "graph");
          // knowledgeMap.updateData(transformedData);
          loadingElement.style.display = 'none';
          
        })
        .catch(error => console.error("Fehler beim Laden der Daten:", error));
    }
    
    // Beispiel für das Laden externer Daten:
    loadExternalResourceData('https://orte-backend-staging.a-thousand-channels.xyz/public/maps/from-gay-to-queer/tags');
    const title = document.getElementById('title');
    title.textContent = "From Gay To Queer";


    // Resize-Handler
    window.addEventListener('resize', () => {
      const width = document.getElementById('graph').getBoundingClientRect().width;
      const height = document.getElementById('graph').getBoundingClientRect().height;
      
      knowledgeMap.svg
        .attr("width", width)
        .attr("height", height);
        
      knowledgeMap.simulation
        .force("center", d3.forceCenter(width / 2, height / 2))
        .alpha(1)
        .restart();
    });