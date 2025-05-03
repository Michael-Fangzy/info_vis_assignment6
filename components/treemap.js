import React, { useEffect, useState } from "react";
import { treemap, hierarchy, scaleOrdinal, schemeDark2, format } from "d3";

export function TreeMap({ margin, svg_width, svg_height, tree, selectedCell, setSelectedCell }) {
  const [hovered, setHovered] = useState(null);
  const [root, setRoot] = useState(null);
  const [groupLabels, setGroupLabels] = useState([]);

  const innerWidth = svg_width - margin.left - margin.right;
  const innerHeight = svg_height - margin.top - margin.bottom;

  const labelFromNode = (node) => `${node.parent?.data.attr || ""}: ${node.parent?.data.name || ""}`;

  useEffect(() => {
    const rootData = hierarchy(tree)
      .sum(d => (d.children ? 0 : d.value))
      .sort((a, b) => b.value - a.value);

    treemap().size([innerWidth, innerHeight]).padding(1.5)(rootData);

    const allLeaves = rootData.leaves();
    const uniqueGroupLabels = [...new Set(allLeaves.map(labelFromNode))];

    setRoot(rootData);
    setGroupLabels(uniqueGroupLabels);
  }, [tree, innerWidth, innerHeight]);

  if (!root) return null;

  const color = scaleOrdinal(schemeDark2).domain(groupLabels);
  const leaves = root.leaves();
  const firstLayer = root.children || [];

  return (
    <svg
      viewBox={`0 0 ${svg_width} ${svg_height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%" }}
    >
      {/* ✅ Legend 图例 */}
      <g transform={`translate(${margin.left}, ${margin.top - 25})`}>
        {groupLabels.map((entry, i) => {
          const [attr, val] = entry.split(":");
          return (
            <g key={entry} transform={`translate(${i * 140}, 0)`}>
              <rect width={20} height={20} fill={color(entry)} />
              <text x={25} y={15} fontSize="12px" fill="black">
                {`${attr.trim()}: ${val.trim()}`}
              </text>
            </g>
          );
        })}
      </g>

      <g transform={`translate(${margin.left}, ${margin.top})`}>
        {leaves.map((d, i) => {
          const width = d.x1 - d.x0;
          const height = d.y1 - d.y0;
          const percent = format(".1%")(d.value / d.parent.value);
          const label = d.data.name;

          return (
            <g
              key={i}
              transform={`translate(${d.x0}, ${d.y0})`}
              onMouseEnter={() => setHovered(d)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setSelectedCell(d)}
              style={{ cursor: "pointer" }}
            >
              <rect
                width={width}
                height={height}
                fill={color(labelFromNode(d))}
                stroke="#999"
                strokeWidth={1}
                opacity={0.85}
              />
              {(hovered?.data === d.data || selectedCell?.data === d.data) && (
                <rect
                  width={width}
                  height={height}
                  fill="red"
                  opacity={0.3}
                  pointerEvents="none"
                />
              )}
              <text x={4} y={12} fontSize={9} fill="white">
                {`${d.data.attr}: ${label}`}
              </text>
              <text x={4} y={22} fontSize={9} fill="white">
                {`Value: ${percent}`}
              </text>
            </g>
          );
        })}

        {firstLayer.map((group, i) => {
          const boxW = group.x1 - group.x0;
          const boxH = group.y1 - group.y0;
          const labelText = `${group.data.attr}: ${group.data.name}`;

          return (
            <g key={i} transform={`translate(${group.x0}, ${group.y0})`}>
              <rect
                width={boxW}
                height={boxH}
                stroke="#999"
                fill="none"
                strokeWidth={1}
              />
              <text
                x={boxW / 2}
                y={boxH / 2}
                fontSize={24}
                textAnchor="middle"
                opacity={0.25}
                fill="black"
                transform={`rotate(${boxW > boxH ? 0 : 90}, ${boxW / 2}, ${boxH / 2})`}
              >
                {labelText}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
