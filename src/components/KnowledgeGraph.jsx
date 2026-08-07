import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useApp } from '../context/AppContext';
import { Share2, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

export default function KnowledgeGraph() {
    const { graphData, isDarkMode, isBuildingGraph } = useApp();
    const svgRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (!graphData || !svgRef.current) return;

        const width = containerRef.current.clientWidth;
        const height = 500;

        const svg = d3.select(svgRef.current)
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height]);

        svg.selectAll("*").remove();

        const g = svg.append("g");

        // Add zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.1, 8])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        svg.call(zoom);

        const nodes = graphData.nodes.map(d => ({ ...d }));
        const links = graphData.links.map(d => ({ ...d }));

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(150))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(60));

        const link = g.append("g")
            .attr("stroke", isDarkMode ? "#334155" : "#e2e8f0")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke-width", d => Math.sqrt(d.value || 1));

        const node = g.append("g")
            .selectAll("g")
            .data(nodes)
            .join("g")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        node.append("circle")
            .attr("r", d => d.type === 'controller' ? 24 : 18)
            .attr("fill", d => {
                switch(d.type) {
                    case 'controller': return "#6366f1";
                    case 'route': return "#10b981";
                    case 'service': return "#f59e0b";
                    case 'model': return "#ec4899";
                    case 'middleware': return "#8b5cf6";
                    case 'database': return "#0ea5e9";
                    default: return "#94a3b8";
                }
            })
            .attr("stroke", isDarkMode ? "#1e293b" : "#fff")
            .attr("stroke-width", 2);

        node.append("text")
            .attr("dy", 35)
            .attr("text-anchor", "middle")
            .attr("fill", isDarkMode ? "#cbd5e1" : "#475569")
            .attr("font-size", "10px")
            .attr("font-weight", "600")
            .text(d => d.name);

        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node
                .attr("transform", d => `translate(${d.x},${d.y})`);
        });

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

        return () => simulation.stop();
    }, [graphData, isDarkMode]);

    if (isBuildingGraph) {
        return (
            <div className={`h-[500px] flex flex-col items-center justify-center rounded-3xl border border-dashed transition-all ${isDarkMode ? 'bg-slate-900/20 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="relative w-16 h-16 mb-4">
                    <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping"></div>
                    <div className="relative w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/20">
                        <Share2 className="w-8 h-8 text-indigo-400 animate-pulse" />
                    </div>
                </div>
                <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Building Knowledge Graph</h3>
                <p className={`text-[11px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Analyzing component relationships...</p>
            </div>
        );
    }

    if (!graphData) return null;

    return (
        <div ref={containerRef} className={`relative rounded-3xl border overflow-hidden transition-all ${isDarkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
                <div className={`p-2 rounded-xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <Share2 className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                    <h3 className={`text-xs font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Dependency Graph</h3>
                    <p className={`text-[10px] font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Visualizing GraphRAG Intelligence</p>
                </div>
            </div>

            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                <button className={`p-2 rounded-xl border transition-all hover:scale-105 active:scale-95 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`}>
                    <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button className={`p-2 rounded-xl border transition-all hover:scale-105 active:scale-95 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`}>
                    <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button className={`p-2 rounded-xl border transition-all hover:scale-105 active:scale-95 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`}>
                    <Maximize2 className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="absolute bottom-4 left-4 z-10 flex flex-wrap gap-3 max-w-[80%]">
                {[
                    { label: 'Controller', color: '#6366f1' },
                    { label: 'Route', color: '#10b981' },
                    { label: 'Service', color: '#f59e0b' },
                    { label: 'Model', color: '#ec4899' },
                    { label: 'Middleware', color: '#8b5cf6' },
                    { label: 'Database', color: '#0ea5e9' }
                ].map(item => (
                    <div key={item.label} className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className={`text-[9px] font-bold tracking-wider uppercase ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{item.label}</span>
                    </div>
                ))}
            </div>

            <svg ref={svgRef} className="cursor-grab active:cursor-grabbing"></svg>
        </div>
    );
}
